package ru.itis.project;

import java.util.Arrays;

public class Main {
    public static void main(String[] args) throws Exception {

        /* Простейшая проверка Stooge Sort */
        int[] arr =  {1, 3, 4, 2, 6, 0, 5 };
        int n = arr.length;
        StoogeSort.stoogeSort(arr, 0, n - 1);
        System.out.println(Arrays.toString(arr));


        /* Запуск метрик и сортировок*/
        Runner.startApp();
    }

}
