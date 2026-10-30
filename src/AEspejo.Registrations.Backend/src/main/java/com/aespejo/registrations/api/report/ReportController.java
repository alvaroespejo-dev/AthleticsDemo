package com.aespejo.registrations.api.report;

import com.aespejo.registrations.application.report.MasterReportModels.MasterReport;
import com.aespejo.registrations.application.report.MasterReportService;
import com.aespejo.registrations.infrastructure.security.Policies;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

/** Reports of an event. Readable by any signed-in user, including read-only accounts. */
@RestController
public class ReportController {

    private final MasterReportService reports;

    public ReportController(MasterReportService reports) {
        this.reports = reports;
    }

    @GetMapping("/api/events/{eventId}/reports/master")
    @PreAuthorize(Policies.READ)
    public MasterReport master(@PathVariable int eventId) {
        return reports.build(eventId);
    }
}
