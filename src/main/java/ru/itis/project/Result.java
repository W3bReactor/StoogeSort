package ru.itis.project;

public class Result {
    private int size;
    private double timeNs;
    private long recursiveCalls;
    private long swaps;
    private long operations;
    private String type;

    public Result(int size, double timeNs, long recursiveCalls, long swaps, String type) {
        this.size = size;
        this.timeNs = timeNs;
        this.recursiveCalls = recursiveCalls;
        this.swaps = swaps;
        this.operations = recursiveCalls + swaps;
        this.type = type;
    }

    public int getSize() { return size; }
    public double getTimeNs() { return timeNs; }
    public double getTimeMs() { return timeNs / 1_000_000.0; }
    public long getRecursiveCalls() { return recursiveCalls; }
    public long getSwaps() { return swaps; }
    public long getOperations() { return operations; }
    public String getType() { return type; }
}
