package ru.itis.project;

import java.io.BufferedWriter;
import java.io.FileWriter;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Random;

/*
    Генератор данных
*/

public class DataGenerator {

    private static final String DATA_DIR = "data";

    public static void main(String[] args) throws IOException {
        generateAll();
    }

    public static void generateAll() throws IOException {
        Files.createDirectories(Path.of(DATA_DIR));

        for (int size : ExperimentConfig.SIZES) {
            for (String type : ExperimentConfig.TYPES) {
                generateOne(type, size);
            }

            System.out.println("Generated size=" + size);
        }

        System.out.println("All datasets are ready.");
    }

    public static void ensureOne(String type, int size) throws IOException {
        Path path = Path.of(DATA_DIR, type + "_" + size + ".txt");

        if (Files.notExists(path)) {
            generateOne(type, size);
        }
    }

    public static void generateOne(String type, int size) throws IOException {
        Files.createDirectories(Path.of(DATA_DIR));
        Random random = createRandom(type, size);

        switch (type) {
            case "random":
                generateRandom(size, random);
                break;
            case "sorted":
                generateSorted(size);
                break;
            case "reversed":
                generateReversed(size);
                break;
            case "almost":
                generateAlmostSorted(size, random);
                break;
            default:
                throw new IllegalArgumentException("Unknown type: " + type);
        }
    }

    private static Random createRandom(String type, int size) {
        long seed = 31L * size + type.hashCode();
        return new Random(seed);
    }

    private static void generateRandom(int size, Random random) throws IOException {
        int[] arr = new int[size];

        for (int i = 0; i < size; i++) {
            arr[i] = random.nextInt(100000);
        }

        save(arr, "random_" + size + ".txt");
    }

    private static void generateSorted(int size) throws IOException {
        int[] arr = new int[size];

        for (int i = 0; i < size; i++) {
            arr[i] = i;
        }

        save(arr, "sorted_" + size + ".txt");
    }

    private static void generateReversed(int size) throws IOException {
        int[] arr = new int[size];

        for (int i = 0; i < size; i++) {
            arr[i] = size - i;
        }

        save(arr, "reversed_" + size + ".txt");
    }

    private static void generateAlmostSorted(int size, Random random) throws IOException {
        int[] arr = new int[size];

        for (int i = 0; i < size; i++) {
            arr[i] = i;
        }

        int swaps = Math.max(1, size / 50);

        for (int i = 0; i < swaps; i++) {
            int a = random.nextInt(size);
            int b = random.nextInt(size);

            int temp = arr[a];
            arr[a] = arr[b];
            arr[b] = temp;
        }

        save(arr, "almost_" + size + ".txt");
    }

    private static void save(int[] arr, String filename) throws IOException {
        try (BufferedWriter writer = new BufferedWriter(new FileWriter(DATA_DIR + "/" + filename))) {
            for (int num : arr) {
                writer.write(num + " ");
            }
        }
    }
}
