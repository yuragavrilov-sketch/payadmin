package com.payadmin.infra.service;

import com.payadmin.infra.entity.Host;
import com.payadmin.infra.repository.HostRepository;
import com.payadmin.infra.repository.ServiceStatusLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class MonitorScheduler {

    private static final Logger log = LoggerFactory.getLogger(MonitorScheduler.class);

    private final HostRepository hostRepository;
    private final MonitoringService monitoringService;
    private final ServiceStatusLogRepository statusLogRepository;

    public MonitorScheduler(HostRepository hostRepository,
                            MonitoringService monitoringService,
                            ServiceStatusLogRepository statusLogRepository) {
        this.hostRepository = hostRepository;
        this.monitoringService = monitoringService;
        this.statusLogRepository = statusLogRepository;
    }

    @Scheduled(fixedDelayString = "${winrm.monitor.interval:60000}")
    public void pollAllHosts() {
        List<Host> hosts = hostRepository.findByEnabledTrue();
        log.info("Polling {} enabled hosts", hosts.size());
        for (Host host : hosts) {
            try {
                monitoringService.pollHost(host);
            } catch (Exception e) {
                log.error("Failed to poll host {}: {}", host.getHostname(), e.getMessage());
            }
        }
    }

    @Scheduled(cron = "0 0 3 * * *")
    @Transactional("managementTransactionManager")
    public void cleanupOldStatusLogs() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(7);
        statusLogRepository.deleteOlderThan(cutoff);
        log.info("Cleaned up status logs older than {}", cutoff);
    }
}
