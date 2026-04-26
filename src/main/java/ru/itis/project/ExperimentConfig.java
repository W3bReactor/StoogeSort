package ru.itis.project;


/*
    Это просто конфиг с данными
*/

public final class ExperimentConfig {



    public static final int START_SIZE = 100;
    public static final int END_SIZE = 2500;
    public static final int STEP = 100;

    public static final int WARMUP_RUNS = 2;
    public static final int MEASURE_RUNS = 5;

    public static final int[] SIZES = buildSizes(START_SIZE, END_SIZE, STEP);

    public static final String[] TYPES = {
            "random", "sorted", "reversed", "almost"
    };

    private ExperimentConfig() {
    }


    /*
        Создание размеров входных данных (для удобства)
    */
    private static int[] buildSizes(int start, int end, int step) {
        if (step <= 0) {
            throw new IllegalArgumentException("Step must be positive");
        }

        int count = ((end - start) / step) + 1;
        int[] sizes = new int[count];
        int value = start;

        for (int i = 0; i < count; i++) {
            sizes[i] = value;
            value += step;
        }

        return sizes;
    }
}
