package com.payadmin.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "\"AP#MERCHANTS\"")
public class Merchant {

    @Id
    @Column(name = "MERCID")
    private Integer mercid;

    @Column(name = "NAME", nullable = false)
    private String name;

    @Column(name = "HIERARCHYID")
    private Integer hierarchyId;

    @Column(name = "PALOGIN")
    private String paLogin;

    @Column(name = "PAPASSWORD")
    private String paPassword;

    @Column(name = "APILOGIN")
    private String apiLogin;

    @Column(name = "APIPASSWORD")
    private String apiPassword;

    @Column(name = "INITIATOR", nullable = false)
    private String initiator;

    @Column(name = "CIRCUIT")
    private String circuit;

    public Integer getMercid() { return mercid; }
    public void setMercid(Integer mercid) { this.mercid = mercid; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Integer getHierarchyId() { return hierarchyId; }
    public void setHierarchyId(Integer hierarchyId) { this.hierarchyId = hierarchyId; }
    public String getPaLogin() { return paLogin; }
    public void setPaLogin(String paLogin) { this.paLogin = paLogin; }
    public String getPaPassword() { return paPassword; }
    public void setPaPassword(String paPassword) { this.paPassword = paPassword; }
    public String getApiLogin() { return apiLogin; }
    public void setApiLogin(String apiLogin) { this.apiLogin = apiLogin; }
    public String getApiPassword() { return apiPassword; }
    public void setApiPassword(String apiPassword) { this.apiPassword = apiPassword; }
    public String getInitiator() { return initiator; }
    public void setInitiator(String initiator) { this.initiator = initiator; }
    public String getCircuit() { return circuit; }
    public void setCircuit(String circuit) { this.circuit = circuit; }
}
