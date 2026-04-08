package com.payadmin.infra.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.payadmin.infra.dto.MonitoringGroupDto;
import com.payadmin.infra.dto.MonitoringServiceDto;
import com.payadmin.infra.entity.*;
import com.payadmin.infra.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(value = "managementTransactionManager", readOnly = true)
public class MonitoringService {

    private static final Logger log = LoggerFactory.getLogger(MonitoringService.class);

    private final MonitoredServiceRepository monitoredServiceRepository;
    private final ServiceStatusLogRepository serviceStatusLogRepository;
    private final ServiceGroupRepository serviceGroupRepository;
    private final HostRepository hostRepository;
    private final CredentialRepository credentialRepository;
    private final WinRmService winRmService;
    private final CryptoService cryptoService;
    private final AuditService auditService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public MonitoringService(MonitoredServiceRepository monitoredServiceRepository,
                             ServiceStatusLogRepository serviceStatusLogRepository,
                             ServiceGroupRepository serviceGroupRepository,
                             HostRepository hostRepository,
                             CredentialRepository credentialRepository,
                             WinRmService winRmService,
                             CryptoService cryptoService,
                             AuditService auditService) {
        this.monitoredServiceRepository = monitoredServiceRepository;
        this.serviceStatusLogRepository = serviceStatusLogRepository;
        this.serviceGroupRepository = serviceGroupRepository;
        this.hostRepository = hostRepository;
        this.credentialRepository = credentialRepository;
        this.winRmService = winRmService;
        this.cryptoService = cryptoService;
        this.auditService = auditService;
    }

    public List<MonitoringGroupDto> getGroupedStatus() {
        List<ServiceGroup> groups = serviceGroupRepository.findAllByOrderBySortOrderAsc();
        List<MonitoredService> allServices = monitoredServiceRepository.findAll();

        Map<Integer, List<MonitoredService>> servicesByGroup = allServices.stream()
                .collect(Collectors.groupingBy(s -> s.getGroup().getId()));

        List<MonitoringGroupDto> result = new ArrayList<>();
        for (ServiceGroup group : groups) {
            List<MonitoredService> groupServices = servicesByGroup.getOrDefault(group.getId(), List.of());
            List<MonitoringServiceDto> serviceDtos = new ArrayList<>();
            long running = 0, stopped = 0, unreachable = 0;

            for (MonitoredService ms : groupServices) {
                var latestLog = serviceStatusLogRepository
                        .findTopByMonitoredServiceIdOrderByCheckedAtDesc(ms.getId());

                String status = "Unknown";
                Integer pid = null;
                LocalDateTime checkedAt = null;
                String errorMessage = null;

                if (latestLog.isPresent()) {
                    ServiceStatusLog logEntry = latestLog.get();
                    status = logEntry.getStatus();
                    pid = logEntry.getPid();
                    checkedAt = logEntry.getCheckedAt();
                    errorMessage = logEntry.getErrorMessage();
                }

                switch (status) {
                    case "Running" -> running++;
                    case "Stopped" -> stopped++;
                    default -> unreachable++;
                }

                serviceDtos.add(new MonitoringServiceDto(
                        ms.getId(),
                        ms.getServiceName(),
                        ms.getDisplayName(),
                        ms.getHost().getId(),
                        ms.getHost().getHostname(),
                        status,
                        pid,
                        checkedAt,
                        errorMessage
                ));
            }

            result.add(new MonitoringGroupDto(
                    group.getId(),
                    group.getName(),
                    group.getDescription(),
                    serviceDtos,
                    running, stopped, unreachable
            ));
        }

        return result;
    }

    @Transactional("managementTransactionManager")
    public String executeAction(Integer serviceId, String action) {
        MonitoredService ms = monitoredServiceRepository.findById(serviceId)
                .orElseThrow(() -> new RuntimeException("Monitored service not found: " + serviceId));

        Host host = ms.getHost();
        Credential credential = host.getCredential();
        String password = cryptoService.decrypt(credential.getPasswordEncrypted());

        String psCommand = switch (action.toUpperCase()) {
            case "START" -> "Start-Service -Name '" + ms.getServiceName() + "'";
            case "STOP" -> "Stop-Service -Name '" + ms.getServiceName() + "' -Force";
            case "RESTART" -> "Restart-Service -Name '" + ms.getServiceName() + "' -Force";
            default -> throw new IllegalArgumentException("Unknown action: " + action);
        };

        try {
            WinRmService.CommandResult cmdResult = winRmService.execute(
                    host.getHostname(), host.getPort(), host.getUseHttps(),
                    credential.getDomain(), credential.getUsername(), password,
                    psCommand);

            if (cmdResult.exitCode() == 0) {
                auditService.log(action.toUpperCase(), host, ms.getServiceName(), "Success", null);
                return "Success";
            } else {
                String error = cmdResult.stderr().isEmpty() ? cmdResult.stdout() : cmdResult.stderr();
                auditService.log(action.toUpperCase(), host, ms.getServiceName(), "Failed", error);
                return "Failed: " + error;
            }
        } catch (Exception e) {
            auditService.log(action.toUpperCase(), host, ms.getServiceName(), "Failed", e.getMessage());
            return "Failed: " + e.getMessage();
        }
    }

    @Transactional("managementTransactionManager")
    public void pollHost(Host host) {
        Credential credential = host.getCredential();
        String password = cryptoService.decrypt(credential.getPasswordEncrypted());

        List<MonitoredService> services = monitoredServiceRepository.findByHostId(host.getId());

        for (MonitoredService ms : services) {
            ServiceStatusLog logEntry = new ServiceStatusLog();
            logEntry.setMonitoredService(ms);
            logEntry.setCheckedAt(LocalDateTime.now());

            try {
                String psCommand = "Get-Service -Name '" + ms.getServiceName() +
                        "' | Select-Object Status,@{N='Id';E={$_.ServiceHandle}} | ConvertTo-Json";

                WinRmService.CommandResult cmdResult = winRmService.execute(
                        host.getHostname(), host.getPort(), host.getUseHttps(),
                        credential.getDomain(), credential.getUsername(), password,
                        psCommand);

                if (cmdResult.exitCode() == 0 && !cmdResult.stdout().isEmpty()) {
                    JsonNode json = objectMapper.readTree(cmdResult.stdout());
                    String status = json.has("Status") ? parseServiceStatus(json.get("Status")) : "Unknown";
                    Integer pid = json.has("Id") && !json.get("Id").isNull()
                            ? parseIntSafe(json.get("Id").asText()) : null;

                    logEntry.setStatus(status);
                    logEntry.setPid(pid);
                } else {
                    logEntry.setStatus("Unknown");
                    logEntry.setErrorMessage(cmdResult.stderr());
                }

                host.setLastSeen(LocalDateTime.now());
                hostRepository.save(host);

            } catch (Exception e) {
                log.error("Failed to poll service {} on host {}: {}",
                        ms.getServiceName(), host.getHostname(), e.getMessage());
                logEntry.setStatus("Unknown");
                logEntry.setErrorMessage(e.getMessage());
            }

            serviceStatusLogRepository.save(logEntry);
        }
    }

    private String parseServiceStatus(JsonNode statusNode) {
        if (statusNode.isNumber()) {
            return switch (statusNode.asInt()) {
                case 1 -> "Stopped";
                case 4 -> "Running";
                default -> "Unknown";
            };
        }
        String text = statusNode.asText();
        if ("Running".equalsIgnoreCase(text) || "4".equals(text)) return "Running";
        if ("Stopped".equalsIgnoreCase(text) || "1".equals(text)) return "Stopped";
        return "Unknown";
    }

    private Integer parseIntSafe(String value) {
        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
