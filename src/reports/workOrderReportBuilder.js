class WorkOrderReportBuilder {
  constructor() {
    this.adHoc = null;
    this.threeStrike = null;
    this.damaged = null;
    this.plated = null;
    this.completed = null;
    this.gis = null;
    this.review = null;
    this.shortCode = null;
  }

  getGISReport() {
    if (!this.gis) {
      this.gis = new GISReport();
    }
    return this.gis;
  }

  getAdHocReport() {
    if (!this.adHoc) {
      this.adHoc = new AdHocReport();
    }
    return this.adHoc;
  }

  getThreeStrikeReport() {
    if (!this.threeStrike) {
      this.threeStrike = new ThreeStrikeReport();
    }
    return this.threeStrike;
  }

  getDamagedReport() {
    if (!this.damaged) {
      this.damaged = new DamagedReport();
    }
    return this.damaged;
  }

  getPlatedReport() {
    if (!this.plated) {
      this.plated = new PlatedReport();
    }
    return this.plated;
  }

  getCompletedReport() {
    if (!this.completed) {
      this.completed = new CompletedReport();
    }
    return this.completed;
  }

  add(workOrder) {
    const { workOrderFlaggedAs3strike, workOrderFlaggedAsAdHoc, workOrderFlaggedAsDamaged, workOrderFlaggedAsPlated } = workOrder;
    if (workOrderFlaggedAs3strike) {
      this.getThreeStrikeReport().add(workOrder);
    } else if (workOrderFlaggedAsAdHoc) {
      this.getAdHocReport().add(workOrder);
    } else if (workOrderFlaggedAsDamaged) {
      this.getDamagedReport().add(workOrder);
    } else if (workOrderFlaggedAsPlated) {
      this.getPlatedReport().add(workOrder);
    } else {
      this.getCompletedReport().add(workOrder);
    }
  }

  getAllReports() {
    const reports = [];
    if (this.adHoc) reports.push(this.adHoc);
    if (this.threeStrike) reports.push(this.threeStrike);
    if (this.damaged) reports.push(this.damaged);
    if (this.plated) reports.push(this.plated);
    if (this.completed) reports.push(this.completed);
    if (this.gis) reports.push(this.gis);
    if (this.review) reports.push(this.review);
    return reports;
  }

  setShortCode(shortCode) {
    this.shortCode = shortCode;
  }
}

module.exports = WorkOrderReportBuilder;