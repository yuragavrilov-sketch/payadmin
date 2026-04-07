package com.payadmin.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import java.time.LocalDate;

@Entity
@Table(name = "MERC_CONFIG")
@IdClass(MercConfigId.class)
public class MercConfig {

    @Id
    @Column(name = "MERCID")
    private Integer mercid;

    @Id
    @Column(name = "PARAMETERNAME", nullable = false)
    private String parameterName;

    @Column(name = "PARAMETERVALUE", nullable = false)
    private String parameterValue;

    @Id
    @Column(name = "DATEBEGIN")
    private LocalDate dateBegin;

    @Column(name = "DATEEND")
    private LocalDate dateEnd;

    public Integer getMercid() { return mercid; }
    public void setMercid(Integer mercid) { this.mercid = mercid; }
    public String getParameterName() { return parameterName; }
    public void setParameterName(String parameterName) { this.parameterName = parameterName; }
    public String getParameterValue() { return parameterValue; }
    public void setParameterValue(String parameterValue) { this.parameterValue = parameterValue; }
    public LocalDate getDateBegin() { return dateBegin; }
    public void setDateBegin(LocalDate dateBegin) { this.dateBegin = dateBegin; }
    public LocalDate getDateEnd() { return dateEnd; }
    public void setDateEnd(LocalDate dateEnd) { this.dateEnd = dateEnd; }
}
