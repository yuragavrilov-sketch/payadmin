package com.payadmin.entity;

import java.io.Serializable;
import java.time.LocalDate;
import java.util.Objects;

public class MercConfigId implements Serializable {
    private Integer mercid;
    private String parameterName;
    private LocalDate dateBegin;

    public MercConfigId() {}

    public MercConfigId(Integer mercid, String parameterName, LocalDate dateBegin) {
        this.mercid = mercid;
        this.parameterName = parameterName;
        this.dateBegin = dateBegin;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof MercConfigId that)) return false;
        return Objects.equals(mercid, that.mercid)
                && Objects.equals(parameterName, that.parameterName)
                && Objects.equals(dateBegin, that.dateBegin);
    }

    @Override
    public int hashCode() {
        return Objects.hash(mercid, parameterName, dateBegin);
    }
}
