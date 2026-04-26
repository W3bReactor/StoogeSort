package ru.itis.project;

import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.FileOutputStream;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;

/*
    Для удобства решил сгенерировать импортёр данных в Excel
*/

public class ExcelExporter {

    public static void export(List<Result> results, String filename) throws Exception {
        Workbook workbook = new XSSFWorkbook();
        Sheet resultsSheet = workbook.createSheet("Results");

        int rowNum = 0;
        Row header = resultsSheet.createRow(rowNum++);
        header.createCell(0).setCellValue("Size");
        header.createCell(1).setCellValue("Type");
        header.createCell(2).setCellValue("Time (ns)");
        header.createCell(3).setCellValue("Time (ms)");
        header.createCell(4).setCellValue("Recursive calls");
        header.createCell(5).setCellValue("Swaps");
        header.createCell(6).setCellValue("Operations");

        for (Result result : results) {
            Row row = resultsSheet.createRow(rowNum++);
            row.createCell(0).setCellValue(result.getSize());
            row.createCell(1).setCellValue(result.getType());
            row.createCell(2).setCellValue(result.getTimeNs());
            row.createCell(3).setCellValue(result.getTimeMs());
            row.createCell(4).setCellValue(result.getRecursiveCalls());
            row.createCell(5).setCellValue(result.getSwaps());
            row.createCell(6).setCellValue(result.getOperations());
        }

        writeExperimentSheet(workbook);
        writeTheorySheet(workbook, results);
        writeMetricSheet(workbook, "TimeMsByType", results, MetricType.TIME_MS);
        writeMetricSheet(workbook, "OperationsByType", results, MetricType.OPERATIONS);
        autoSizeColumns(resultsSheet, 7);

        try (FileOutputStream fileOut = new FileOutputStream(filename)) {
            workbook.write(fileOut);
        }

        workbook.close();
    }

    private static void writeExperimentSheet(Workbook workbook) {
        Sheet sheet = workbook.createSheet("Experiment");

        String[][] rows = {
                {"Start size", String.valueOf(ExperimentConfig.START_SIZE)},
                {"End size", String.valueOf(ExperimentConfig.END_SIZE)},
                {"Step", String.valueOf(ExperimentConfig.STEP)},
                {"Dataset count", String.valueOf(ExperimentConfig.SIZES.length * ExperimentConfig.TYPES.length)},
                {"Warmup runs", String.valueOf(ExperimentConfig.WARMUP_RUNS)},
                {"Time measurement runs", String.valueOf(ExperimentConfig.MEASURE_RUNS)},
                {"Data types", String.join(", ", ExperimentConfig.TYPES)}
        };

        for (int i = 0; i < rows.length; i++) {
            Row row = sheet.createRow(i);
            row.createCell(0).setCellValue(rows[i][0]);
            row.createCell(1).setCellValue(rows[i][1]);
        }

        autoSizeColumns(sheet, 2);
    }

    private static void writeTheorySheet(Workbook workbook, List<Result> results) {
        Sheet theorySheet = workbook.createSheet("Theory");
        Row header = theorySheet.createRow(0);

        header.createCell(0).setCellValue("Size");
        header.createCell(1).setCellValue("Exact recursive calls");
        header.createCell(2).setCellValue("Smooth k * n^2.7095");

        Set<Integer> sizes = new TreeSet<>();
        for (Result result : results) {
            sizes.add(result.getSize());
        }

        if (sizes.isEmpty()) {
            return;
        }

        int baseSize = sizes.iterator().next();
        long baseValue = TheoryEstimator.exactCallCount(baseSize);

        int rowNum = 1;
        for (int size : sizes) {
            Row row = theorySheet.createRow(rowNum++);
            row.createCell(0).setCellValue(size);
            row.createCell(1).setCellValue(TheoryEstimator.exactCallCount(size));
            row.createCell(2).setCellValue(TheoryEstimator.smoothApproximation(size, baseSize, baseValue));
        }

        autoSizeColumns(theorySheet, 3);
    }

    private static void writeMetricSheet(Workbook workbook, String sheetName, List<Result> results, MetricType metricType) {
        Sheet sheet = workbook.createSheet(sheetName);
        Row header = sheet.createRow(0);
        header.createCell(0).setCellValue("Size");

        for (int i = 0; i < ExperimentConfig.TYPES.length; i++) {
            header.createCell(i + 1).setCellValue(ExperimentConfig.TYPES[i]);
        }

        Map<Integer, Map<String, Result>> indexedResults = indexResults(results);
        Set<Integer> sizes = new TreeSet<>(indexedResults.keySet());

        int rowNum = 1;
        for (int size : sizes) {
            Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue(size);

            Map<String, Result> byType = indexedResults.get(size);
            for (int i = 0; i < ExperimentConfig.TYPES.length; i++) {
                Result result = byType.get(ExperimentConfig.TYPES[i]);
                if (result == null) {
                    continue;
                }

                if (metricType == MetricType.TIME_MS) {
                    row.createCell(i + 1).setCellValue(result.getTimeMs());
                } else {
                    row.createCell(i + 1).setCellValue(result.getOperations());
                }
            }
        }

        autoSizeColumns(sheet, ExperimentConfig.TYPES.length + 1);
    }

    private static Map<Integer, Map<String, Result>> indexResults(List<Result> results) {
        Map<Integer, Map<String, Result>> indexedResults = new LinkedHashMap<>();

        for (Result result : results) {
            indexedResults
                    .computeIfAbsent(result.getSize(), ignored -> new LinkedHashMap<>())
                    .put(result.getType(), result);
        }

        return indexedResults;
    }

    private static void autoSizeColumns(Sheet sheet, int columnCount) {
        for (int i = 0; i < columnCount; i++) {
            sheet.autoSizeColumn(i);
        }
    }

    private enum MetricType {
        TIME_MS,
        OPERATIONS
    }
}
