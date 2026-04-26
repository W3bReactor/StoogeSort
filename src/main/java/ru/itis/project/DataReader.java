package ru.itis.project;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;


/*
    Класс, который считывает данные с файлов
*/

public class DataReader {

    public static int[] readArray(String filename) throws IOException {
        BufferedReader reader = new BufferedReader(new FileReader(filename));
        String line = reader.readLine();
        reader.close();

        String[] parts = line.split(" ");
        int[] arr = new int[parts.length];

        for (int i = 0; i < parts.length; i++) {
            arr[i] = Integer.parseInt(parts[i]);
        }

        return arr;
    }
}