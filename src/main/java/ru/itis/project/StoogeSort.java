package ru.itis.project;
import java.util.List;

public class StoogeSort {

    private static long recursiveCalls = 0;
    private static long swaps = 0;

    public static void resetMetrics() {
        recursiveCalls = 0;
        swaps = 0;
    }

    public static SortMetrics measure(int[] arr) {
        resetMetrics();
        stoogeSortMeasured(arr, 0, arr.length - 1);
        return new SortMetrics(recursiveCalls, swaps);
    }

    private static void stoogeSortMeasured(int[] arr, int l, int h) {
        recursiveCalls++;

        if (l >= h)
            return;

        if (arr[l] > arr[h]) {
            swaps++;
            int t = arr[l];
            arr[l] = arr[h];
            arr[h] = t;
        }

        if (h - l + 1 > 2) {
            int t = (h - l + 1) / 3;

            stoogeSortMeasured(arr, l, h - t);
            stoogeSortMeasured(arr, l + t, h);
            stoogeSortMeasured(arr, l, h - t);
        }
    }

    public static SortMetrics measure(List<Integer> list) {
        resetMetrics();
        stoogeSortMeasured(list, 0, list.size() - 1);
        return new SortMetrics(recursiveCalls, swaps);
    }

    private static void stoogeSortMeasured(List<Integer> list, int l, int h) {
        recursiveCalls++;

        if (l >= h)
            return;

        if (list.get(l) > list.get(h)) {
            swaps++;
            int t = list.get(l);
            list.set(l, list.get(h));
            list.set(h, t);
        }

        if (h - l + 1 > 2) {
            int t = (h - l + 1) / 3;

            stoogeSortMeasured(list, l, h - t);
            stoogeSortMeasured(list, l + t, h);
            stoogeSortMeasured(list, l, h - t);
        }
    }

    public static void stoogeSort(List<Integer> list, int l, int h) {
        if (l >= h)
            return;

        if (list.get(l) > list.get(h)) {
            int t = list.get(l);
            list.set(l, list.get(h));
            list.set(h, t);
        }

        if (h - l + 1 > 2) {
            int t = (h - l + 1) / 3;

            stoogeSort(list, l, h - t);
            stoogeSort(list, l + t, h);
            stoogeSort(list, l, h - t);
        }
    }

    /* Как выглядит сортировка в коде */
    public static void stoogeSort(int[] arr, int l, int h) // Массив, левый указатель, правый указатель
    {
        // Если левый указатель больше или равен правому, останавливаемся
        if (l >= h)
            return;

        // Если первый элемент меньше последнего, меняем их местами
        if (arr[l] > arr[h]) {
            int t = arr[l];
            arr[l] = arr[h];
            arr[h] = t;
        }

        // Если в массиве больше 2-ух элементов, то:
        if (h - l + 1 > 2) {
            // находим сколько элементов является 1/3
            int t = (h - l + 1) / 3;

            // Рекурсивно сортируем первую 2/3 часть
            stoogeSort(arr, l, h - t); // Вычитаем из правого указателя 1/3

            // Рекурсивно сортируем вторую 2/3 часть
            stoogeSort(arr, l + t, h); // Добавляем к левому указателю 1/3

            // Рекурсивно сортируем первую 2/3 часть
            // Убеждаемся, что всё отсортировано
            stoogeSort(arr, l, h - t);
        }
    }


}
