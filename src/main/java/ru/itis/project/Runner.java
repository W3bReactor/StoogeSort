package ru.itis.project;

import java.util.ArrayList;
import java.util.List;

public class Runner {

    public static void startApp() throws Exception {
        List<Result> results = new ArrayList<>();
        String basePath = System.getProperty("user.dir") + "/data/";

        for (String type : ExperimentConfig.TYPES) {
            for (int size : ExperimentConfig.SIZES) {
                String filename = basePath + type + "_" + size + ".txt";

                DataGenerator.ensureOne(type, size);
                int[] original = DataReader.readArray(filename);

                /*
                    Прогрев JVM (т.к первый запуск всегда медленнее)
                */
                for (int i = 0; i < ExperimentConfig.WARMUP_RUNS; i++) {
                    // клонируем, чтобы не отсортировало исходный массив
                    int[] arr = original.clone();
                    StoogeSort.stoogeSort(arr, 0, arr.length - 1);
                }

                double avgTimeNs = measureTime(original);
                SortMetrics metrics = measureMetrics(original);

                results.add(new Result(size, avgTimeNs, metrics.recursiveCalls(), metrics.swaps(), type));

                System.out.println("Готово: " + type
                        + " size=" + size
                        + " time=" + (avgTimeNs / 1_000_000.0)
                        + " ms calls=" + metrics.recursiveCalls()
                        + " swaps=" + metrics.swaps()
                        + " operations=" + metrics.operations());
            }
        }

        ExcelExporter.export(results, "results.xlsx");
        System.out.println("Excel файл создан.");
    }

    private static double measureTime(int[] original) {
        long totalTime = 0;

        for (int i = 0; i < ExperimentConfig.MEASURE_RUNS; i++) {
            int[] arr = original.clone();

            long start = System.nanoTime();
            StoogeSort.stoogeSort(arr, 0, arr.length - 1);
            long end = System.nanoTime();

            totalTime += (end - start);
        }

        // Усредняем значения
        return totalTime / (double) ExperimentConfig.MEASURE_RUNS;
    }

    private static SortMetrics measureMetrics(int[] original) {
        int[] arr = original.clone();
        // Вызываем функцию с тем же усреднением, но с подсчётом свапов и рекурсивных вызовов
        return StoogeSort.measure(arr);
    }
}
