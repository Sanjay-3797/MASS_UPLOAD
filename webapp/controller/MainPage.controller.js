sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
  ],
  function (Controller, JSONModel, MessageToast, MessageBox) {
    "use strict";

    return Controller.extend("com.worksheet.worksheet.controller.MainPage", {
      onInit: function () {
        this.sheetNames = [];
        this.sheetData = [];
        this.fileContent = [];
        this.mattype = [];
        this.error = [];
        this.getView().setModel(new JSONModel(), "excelData");

        const buttonSettings = {
          editButton: false,
          clearButton: false,
          submitButton: true,
          docSubmitButton: true,
        };

        const buttonModel = new JSONModel(buttonSettings);
        this.getView().setModel(buttonModel, "buttonModel");

        const graphStats = {
          visible: false,
          totalCount: 0,
          errorCount: 0,
          noErrorCount: 0,
        };

        const graphStatsModel = new JSONModel(graphStats);
        this.getView().setModel(graphStatsModel, "graphStatsModel");

        const smartChartModel = this.getOwnerComponent().getModel(
          "ZP_QU_DG_MARA_MASSREQ_BND"
        );
        this.getView().byId("smartErrorChart").setModel(smartChartModel);

        const smartTableModel = this.getOwnerComponent().getModel(
          "ZP_QU_DG_MARA_MASSREQ_BND"
        );
        this.getView().byId("smartErrorTable").setModel(smartTableModel);

        this.oProgressIndicator = this.getView().byId("idProgressIndicator");

        const customizeConfig = {
          autoColumnWidth: {
            "*": { min: 2, max: 6, gap: 1, truncateLabel: false },
          },
        };
        this.oSmartTable = this.getView().byId("smartErrorTable");
        this.oSmartTable.setCustomizeConfig(customizeConfig);

        // var oVizProperties = {
        //   plotArea: {
        //     dataLabel: {
        //       visible: true,
        //     },
        //     colorPalette: ["#ef6638"], // Custom color for the chart
        //   },
        // };
        // debugger
        // this.oSmartChart = this.getView().byId("smartErrorChart");
        // this.oSmartChart.setVizProperties(oVizProperties);
      },

      onChangeMaterialType: function () {
        this.getView().getModel("buttonModel").setData({
          editButton: false,
          clearButton: true,
          submitButton: true,
          docSubmitButton: true,
        });
      },

      formatMaterialType: function (materialType) {
        var materialTypeText = this.getView()
          .getModel("ZC_QU_DG_MATERIALREQUESTS_CDS")
          .getProperty(
            "/I_MaterialType('" + materialType + "')/MaterialType_Text"
          );
        return materialType + " (" + materialTypeText + ")";
      },

      onPressSubmit: function (oEvent) {
        const oWizard = this.getView().byId("idCreateMaterialWizard");
        const oCurrentStep = this.getView().byId("idMaterialType");
        this.oMultiComboBox = this.getView().byId("idMultiCombo");
        const materialTypes = this.oMultiComboBox.getSelectedKeys();

        if (materialTypes.length === 0) {
          oCurrentStep.setValidated(false);
          oWizard.previousStep();
          MessageToast.show("Please select a Material Type to proceed.");
          return;
        }

        oCurrentStep.setValidated(true);
        oWizard.nextStep();

        let list = materialTypes.map((item) => {
          return { mType: item };
        });
        this.getOwnerComponent().getModel("MaterialType").setData({ list });
        this.oMultiComboBox.setEditable(false);

        this.getView().getModel("buttonModel").setData({
          editButton: true,
          clearButton: true,
          submitButton: false,
          docSubmitButton: true,
        });

        this.oProgressIndicator.setPercentValue(33);
        this.oProgressIndicator.setDisplayValue(`${33}%`);
      },

      onPressClear: function (oEvent) {
        const oWizard = this.getView().byId("idCreateMaterialWizard");
        const oCurrentStep = this.getView().byId("idMaterialType");
        oCurrentStep.setValidated(false);
        oWizard.previousStep();
        oWizard.previousStep();
        oWizard.previousStep();
        oWizard.previousStep();

        this.oMultiComboBox = this.getView().byId("idMultiCombo");
        this.oMultiComboBox.setSelectedKeys([]);
        this.oMultiComboBox.setEditable(true);

        this.getView().getModel("buttonModel").setData({
          editButton: false,
          clearButton: false,
          submitButton: true,
          docSubmitButton: true,
        });

        this.oProgressIndicator.setPercentValue(0);
        this.oProgressIndicator.setDisplayValue(`${0}%`);
      },

      onPressEdit: function (oEvent) {
        this.getView().getModel("buttonModel").setData({
          editButton: false,
          clearButton: true,
          submitButton: true,
          docSubmitButton: true,
        });

        const oWizard = this.getView().byId("idCreateMaterialWizard");
        const oCurrentStep = this.getView().byId("idMaterialType");
        oCurrentStep.setValidated(false);
        oWizard.previousStep();
        oWizard.previousStep();
        oWizard.previousStep();
        oWizard.previousStep();

        // this.oMultiComboBox.setSelectedKeys([]);
        this.oMultiComboBox.setEditable(true);
      },

      onExport: function (e) {
        this.table = this.getView().byId("idMtype_table");
        this.table.setBusy(true);
        this.mtype = e
          .getSource()
          .getParent()
          .getCells()[0]
          .getProperty("title");
        var oModel = this.getOwnerComponent().getModel("ZP_QU_DG_CONFGREQ_CDS");
        var sPath = "/ZP_QU_DG_CONFGREQ";
        var aFilters = [
          new sap.ui.model.Filter(
            "Mattype",
            sap.ui.model.FilterOperator.EQ,
            this.mtype
          ),
        ];
        var that = this;
        oModel.read(sPath, {
          filters: aFilters,
          success: function (res) {
            debugger;
            this.sheetName = res;
            if (!res.results.length) {
              sap.m.MessageBox.error("Your Material Type contains Empty");
              this.table.setBusy(false);
              return;
            }
            var configId = res.results[0].Configid;
            // Assuming you get an array of results
            var Spath =
              "/ZP_QU_DG_CONFGREQ(guid'" + configId + "')/to_confgview";
            var bFilters = [
              new sap.ui.model.Filter(
                "Hidden",
                sap.ui.model.FilterOperator.NE,
                "true"
              ),
            ];
            var sorter = [new sap.ui.model.Sorter("Descrip", false)];
            oModel.read(Spath, {
              filters: bFilters,
              sorters: sorter,
              success: function (res) {
                this.read(res);
              }.bind(this),
              error: function (err) {
                sap.m.MessageBox.error(
                  "Cannot Fetch Data:" + JSON.stringify(err)
                );
                that.table.setBusy(false);
              },
            });
          }.bind(this),
          error: function (err) {
            sap.m.MessageBox.error("Cannot Fetch Data :" + JSON.stringify(err));
            that.table.setBusy(false);
          },
        });
      },

      read: function (res) {
        this.wsheetName = [];
        var that = this;
        res.results.forEach(function (data) {
          that.wsheetName.push(data.Descrip);
        });
        var oModel = this.getOwnerComponent().getModel("ZP_QU_DG_CONFGREQ_CDS");
        var sPath = [];
        res.results.forEach((data) => {
          sPath.push(
            "/ZP_QU_DG_CONFGVIEW(Configid=guid'" +
              data.Configid +
              "',Viewid='" +
              data.Viewid +
              "')/to_confgfld"
          );
        });
        this.sheetDatas = [];
        var successfulReads = 0;
        var totalPaths = sPath.length;

        sPath.forEach((data) => {
          oModel.read(data, {
            success: function (res) {
              this.sheetDatas.push(res);
              successfulReads++;
              if (successfulReads === totalPaths) {
                // Call your function here
                this.Export(this.sheetDatas);
              }
            }.bind(this),
            error: function (err) {
              sap.m.MessageBox.error(
                "Cannot Fetch Data :" + JSON.stringify(err)
              );
              that.table.setBusy(false);
            },
          });
        });
      },

      Export: function (data) {
        console.log(data);
        var that = this;
        var workbook = XLSX.utils.book_new();
        var fileName = this.mtype + ".xlsx";

        data.forEach((dataItem, index) => {
          var headers = [];
          var formattedData = [];

          dataItem.results.forEach(function (row) {
            headers.push(row.Fldname);
            formattedData.push(row.Descrip);
          });

          var worksheet = XLSX.utils.aoa_to_sheet([headers, formattedData]);

          var colWidths = headers.map(() => ({ wch: 17 }));
          worksheet["!cols"] = colWidths;
          var sheetName = this.wsheetName[index % this.wsheetName.length]; // Loop through sheetNames in a circular manner
          XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

          if (index === data.length - 1) {
            // This is the last iteration
            XLSX.writeFile(workbook, fileName, {
              bookType: "xlsx",
              type: "file",
            });
            that.table.setBusy(false);
          }
        });
      },

      onSubmitExcel: function (oEvent) {
        // Change -----------------
        this.oTable = this.getView().byId("idMtype_table");

        this.oTable.setBusy(true);

        let aFileUploader = [];
        this.oTable.getItems().forEach((item) => {
          aFileUploader.push(item.getAggregation("cells")[2]);
        });
        var empty = 0;
        aFileUploader.forEach((data) => {
          if (data.getProperty("value") !== "") {
            empty += 1;
          }
        });
        if (empty > 0) {
          var oModel = this.getOwnerComponent().getModel(
            "ZQU_DG_MAT_MASS_UPLOAD_SRV"
          );
          var sPath = "/MassUploadSet";
          oModel.read(sPath, {
            success: function (res) {
              this.processMassUpload(res.results[0].reqid);

              this.getView()
                .byId("idRequest")
                .setText(`Request Id : ${res.results[0].reqid}`);

              this.getView().getModel("buttonModel").setData({
                editButton: true,
                clearButton: true,
                submitButton: false,
                docSubmitButton: false,
              });
            }.bind(this),
            error: function (err) {
              sap.m.MessageBox.error(
                "Cannot Fetch Data :" + JSON.stringify(err)
              );
              this.oTable.setBusy(false);
            },
          });
        } else {
          sap.m.MessageBox.error("Please upload atleast one Material File");
          this.oTable.setBusy(false);
          return;
        }
      },

      processMassUpload: function (reqid) {
        let oTable = this.getView().byId("idMtype_table").getItems();
        let aFileUploader = [];
        let that = this;
        this.reqid = reqid;

        oTable.forEach((item) => {
          aFileUploader.push(item.getAggregation("cells")[2]);
        });
        this.count = 0;
        aFileUploader.forEach((data) => {
          var oDataModel = that
            .getView()
            .getModel("ZQU_DG_MAT_MASS_UPLOAD_SRV");
          var sTokenForUpload = oDataModel.getSecurityToken();
          var oHeaderParameter = new sap.ui.unified.FileUploaderParameter({
            name: "X-CSRF-Token",
            value: sTokenForUpload,
          });

          var sFile = data.getValue();
          var oHeaderSlug = new sap.ui.unified.FileUploaderParameter({
            name: "SLUG",
            value: `${sFile}|${reqid}`,
          });

          //Header parameter need to be removed then added.
          data.removeAllHeaderParameters();
          data.addHeaderParameter(oHeaderParameter);
          data.addHeaderParameter(oHeaderSlug);
          var sUrl = oDataModel.sServiceUrl + "/MassUploadSet";
          data.setUploadUrl(sUrl);
          data.upload();
          this.count++;
        });
      },

      handleUploadComplete: function (oEvent) {
        var sResponse = oEvent.getParameter("status");
        let error = oEvent.getParameters("response").response;
        if (sResponse === 201 || sResponse === 202 || sResponse === 204) {
          sap.m.MessageToast.show(
            `Files (${this.count}) uploaded Successfully`
          );
          // Call service for Errors

          const oWizard = this.getView().byId("idCreateMaterialWizard");
          const oCurrentStep = this.getView().byId("idOverview");
          this.getView().byId("smartErrorChart").rebindChart();
          this.getView()
            .byId("smartErrorChart")
            .getChartAsync()
            .then((chart) => {
              const oVizProperties = {
                plotArea: {
                  dataLabel: {
                    visible: true,
                  },
                  colorPalette: ["#f53131", "#30914c"],
                },
              };
              chart.setVizProperties(oVizProperties);
            });

          let errorModel = this.getOwnerComponent().getModel(
            "ZP_QU_DG_MARA_MASSREQ_BND"
          );

          errorModel.read("/ZI_QU_DG_Mara_Errorcount", {
            filters: [new sap.ui.model.Filter("Reqid", "EQ", this.reqid)],
            success: function (res) {
              debugger;
              this.getView()
                .getModel("graphStatsModel")
                .setData({
                  visible: true,
                  totalCount:
                    +res?.results[0]?.Errors + +res?.results[0]?.Without_Errors,
                  errorCount: res?.results[0]?.Errors,
                  noErrorCount: res?.results[0]?.Without_Errors,
                });
            }.bind(this),
            error: function (err) {
              sap.m.MessageBox.error(err);
            },
          });

          this.getView().byId("smartErrorTable").rebindTable();

          this.oTable.setBusy(false);
          oCurrentStep.setValidated(true);
          oWizard.nextStep();

          this.oProgressIndicator.setPercentValue(66);
          this.oProgressIndicator.setDisplayValue(`${66}%`);
        } else {
          sap.m.MessageToast.show("Upload Failed" + error);
          this.oTable.setBusy(false);
        }
      },

      onBeforeRebindChart: function (oEvent) {
        oEvent
          .getParameter("bindingParams")
          .filters.push(new sap.ui.model.Filter("Reqid", "EQ", this.reqid));
      },

      onBeforeRebindTable: function (oEvent) {
        oEvent
          .getParameter("bindingParams")
          .filters.push(new sap.ui.model.Filter("Reqid", "EQ", this.reqid));
      },

      formatRowHighlight: function (oValue) {
        if (oValue) {
          return "Error";
        } else {
          return "Success";
        }
      },

      onActionButtonPress: function (oEvent) {
        var oButton = oEvent.getSource();
        let objType = oEvent.getSource().getBindingContext().getObject();
        this.byId("actionSheet").openBy(oButton);
      },

      onChartPress: function(oEvent) {
        debugger
        // Get the selected data point from the chart
        var oSmartChart = this.byId("smartErrorChart");
        var oSelectedData = oEvent.getParameters();
        console.log("Selected Data from Chart: ", oSelectedData);

        // Assume that oSelectedData.data is the key or the dimension you want to filter by
        var selectedDimension = oSelectedData.data; // Adjust this based on what you click on (e.g., category, series)

        // Now filter the table based on the selected dimension
        // this._filterTable(selectedDimension);
    },

      wizardCompletedHandler: function () {},

      handleWizardCancel: function () {},
    });
  }
);
