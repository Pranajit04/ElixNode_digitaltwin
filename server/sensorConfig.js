module.exports = {
  sensors: [
    { id: "P1_FT01", name: "Pump 1 Flow", unit: "L/min", column: "P1_FT01", normalRange: [40, 70], criticalLimit: 90 },
    { id: "P1_LIT01", name: "Tank 1 Level", unit: "%", column: "P1_LIT01", normalRange: [300, 380], criticalLimit: 420 },
    { id: "P1_PIT01", name: "Pump 1 Pressure", unit: "bar", column: "P1_PIT01", normalRange: [0.8, 1.8], criticalLimit: 2.5 },
    { id: "P1_TIT01", name: "Pump 1 Temperature A", unit: "C", column: "P1_TIT01", normalRange: [20, 40], criticalLimit: 60 },
    { id: "P1_TIT02", name: "Pump 1 Temperature B", unit: "C", column: "P1_TIT02", normalRange: [20, 40], criticalLimit: 60 },
    { id: "P1_TIT03", name: "Pump 1 Temperature C", unit: "C", column: "P1_TIT03", normalRange: [20, 40], criticalLimit: 60 },
    { id: "P2_VT01", name: "Unit 2 Vibration", unit: "mm/s", column: "P2_VT01", normalRange: [5, 15], criticalLimit: 20 },
    { id: "P2_SIT01", name: "Unit 2 Speed", unit: "rpm", column: "P2_SIT01", normalRange: [850, 950], criticalLimit: 1100 },
    { id: "P3_FIT01", name: "Process 3 Flow", unit: "L/min", column: "P3_FIT01", normalRange: [4800, 5600], criticalLimit: 6200 },
    { id: "P3_LIT01", name: "Process 3 Level", unit: "mm", column: "P3_LIT01", normalRange: [12000, 14500], criticalLimit: 15500 },
    { id: "P3_PIT01", name: "Process 3 Pressure", unit: "bar", column: "P3_PIT01", normalRange: [20, 40], criticalLimit: 50 },
    { id: "P4_ST_PT01", name: "Steam Pressure", unit: "bar", column: "P4_ST_PT01", normalRange: [300, 360], criticalLimit: 420 },
    { id: "P4_ST_TT01", name: "Steam Temperature", unit: "C", column: "P4_ST_TT01", normalRange: [3000, 3250], criticalLimit: 90 }
  ]
};
