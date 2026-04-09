package com.payadmin.infra.service;

import io.cloudsoft.winrm4j.client.WinRmClient;
import io.cloudsoft.winrm4j.client.ShellCommand;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.StringWriter;

@Service
public class WinRmService {

    private static final Logger log = LoggerFactory.getLogger(WinRmService.class);

    @Value("${winrm.monitor.timeout:30000}")
    private int timeout;

    @Value("${winrm.disable-cert-checks:false}")
    private boolean disableCertChecks;

    public record CommandResult(int exitCode, String stdout, String stderr) {}

    public CommandResult execute(String hostname, int port, boolean useHttps,
                                  String domain, String username, String password,
                                  String command) {
        String protocol = useHttps ? "https" : "http";
        String url = protocol + "://" + hostname + ":" + port + "/wsman";

        try {
            var builder = WinRmClient.builder(url);

            if (domain != null && !domain.isEmpty()) {
                builder.credentials(domain, username, password);
            } else {
                builder.credentials(username, password);
            }

            builder.disableCertificateChecks(disableCertChecks)
                    .operationTimeout((long) timeout);

            WinRmClient client = builder.build();

            try {
                ShellCommand shell = client.createShell();
                try {
                    StringWriter stdoutWriter = new StringWriter();
                    StringWriter stderrWriter = new StringWriter();

                    String psCommand = "powershell.exe -Command \"" +
                            command.replace("\"", "\\\"") + "\"";

                    int exitCode = shell.execute(psCommand, stdoutWriter, stderrWriter);

                    String stdout = stdoutWriter.toString().trim();
                    String stderr = stderrWriter.toString().trim();

                    return new CommandResult(exitCode, stdout, stderr);
                } finally {
                    shell.close();
                }
            } finally {
                client.close();
            }
        } catch (Exception e) {
            log.error("WinRM error on {}: {}", hostname, e.getMessage(), e);
            throw new RuntimeException("WinRM connection failed: " + e.getMessage(), e);
        }
    }
}
