package ru.itis.project;

import java.util.HashMap;
import java.util.Map;

public final class TheoryEstimator {

    public static final double EXPONENT = Math.log(3.0) / Math.log(1.5);

    private static final Map<Integer, Long> CALLS_CACHE = new HashMap<>();

    static {
        CALLS_CACHE.put(0, 1L);
        CALLS_CACHE.put(1, 1L);
        CALLS_CACHE.put(2, 1L);
    }

    private TheoryEstimator() {
    }

    public static long exactCallCount(int size) {
        if (size <= 2) {
            return 1L;
        }

        /* Тут происходит небольшая мемоизация просто для того,
           чтобы быстрее работало (надеюсь к этому не будете придираться)*/
        Long cachedValue = CALLS_CACHE.get(size);
        if (cachedValue != null) {
            return cachedValue;
        }

        int nextSize = size - size / 3;
        long value = 1L + 3L * exactCallCount(nextSize);
        CALLS_CACHE.put(size, value);
        return value;
    }


    /*
        Тут находим коэффицент различия между исходным кол-вом итераций и тем, что
        получаем n^2,7095 (по сути чуть поправляем значения, чтобы ближе к значениям
        графика были)
    */
    public static double smoothApproximation(int size, int baseSize, long baseValue) {
        double coefficient = baseValue / Math.pow(baseSize, EXPONENT);
        return coefficient * Math.pow(size, EXPONENT);
    }
}
