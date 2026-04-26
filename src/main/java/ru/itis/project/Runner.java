package ru.itis.project;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
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

                // ===== ARRAY =====
                processArray(results, original, size, type);

                // ===== ARRAYLIST =====
                processArrayList(results, original, size, type);
            }
        }

        ExcelExporter.export(results, "results.xlsx");
        System.out.println("Excel файл создан.");
    }


    private static void processArray(List<Result> results, int[] original, int size, String type) {
        /*
              Прогрев JVM (т.к первый запуск всегда медленнее)
        */

        for (int i = 0; i < ExperimentConfig.WARMUP_RUNS; i++) {
            // клонируем, чтобы не отсортировало исходный массив
            int[] arr = original.clone();
            StoogeSort.stoogeSort(arr, 0, arr.length - 1);
        }

        double time = measureTimeArray(original);
        SortMetrics metrics = StoogeSort.measure(original.clone());

        results.add(new Result(size, time, metrics.recursiveCalls(), metrics.swaps(), type, "array"));

        System.out.println("Массив готов: " + size + " Тип: " + type);
    }


    private static void processArrayList(List<Result> results, int[] original, int size, String type) {

        List<Integer> base = toList(original);

        // warmup
        for (int i = 0; i < ExperimentConfig.WARMUP_RUNS; i++) {
            List<Integer> list = new ArrayList<>(base);
            StoogeSort.stoogeSort(list, 0, list.size() - 1);
        }

        double time = measureTimeList(base);
        SortMetrics metrics = StoogeSort.measure(new ArrayList<>(base));

        results.add(new Result(size, time, metrics.recursiveCalls(), metrics.swaps(), type, "arraylist"));

        System.out.println("Коллекция готова: " + size + " Тип: " + type);
    }



    private static double measureTimeArray(int[] original) {
        long total = 0;

        for (int i = 0; i < ExperimentConfig.MEASURE_RUNS; i++) {
            int[] arr = original.clone();

            long start = System.nanoTime();
            StoogeSort.stoogeSort(arr, 0, arr.length - 1);
            long end = System.nanoTime();

            total += (end - start);
        }

        return total / (double) ExperimentConfig.MEASURE_RUNS;
    }



    private static double measureTimeList(List<Integer> base) {
        long total = 0;

        for (int i = 0; i < ExperimentConfig.MEASURE_RUNS; i++) {
            List<Integer> list = new ArrayList<>(base);

            long start = System.nanoTime();
            StoogeSort.stoogeSort(list, 0, list.size() - 1);
            long end = System.nanoTime();

            total += (end - start);
        }

        return total / (double) ExperimentConfig.MEASURE_RUNS;
    }


    private static List<Integer> toList(int[] arr) {
        List<Integer> list = new ArrayList<>(arr.length);
        for (int j : arr) {
            list.add(j);
        }
        return list;
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
