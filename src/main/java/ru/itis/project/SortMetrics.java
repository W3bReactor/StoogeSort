package ru.itis.project;

public record SortMetrics(long recursiveCalls, long swaps) {

    public long operations() {
        return recursiveCalls + swaps;
    }
}
