import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  Presentation,
  PresentationFile,
  row,
  column,
  grid,
  layers,
  text,
  shape,
  chart,
  rule,
  fill,
  hug,
  fixed,
  wrap,
  fr,
  auto,
  drawSlideToCtx,
} from "@oai/artifact-tool";
import { Canvas } from "../node_modules/@oai/artifact-tool/node_modules/skia-canvas/lib/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceDir = path.resolve(__dirname, "..");
const outputDir = path.join(workspaceDir, "output");
const scratchDir = path.join(workspaceDir, "scratch");
const previewDir = path.join(scratchDir, "previews");
const metricsPath = path.join(__dirname, "metrics.json");

const slideSize = { width: 1920, height: 1080 };
const frame = { left: 0, top: 0, width: slideSize.width, height: slideSize.height };

const colors = {
  bg: "#F7F2EA",
  paper: "#FFFDF8",
  ink: "#1C1713",
  muted: "#625B54",
  line: "#D9CEC1",
  teal: "#0F766E",
  coral: "#C65B40",
  olive: "#7B8D4F",
  blue: "#3E6588",
  gold: "#B9893C",
  softTeal: "#DCEEEA",
  softCoral: "#F4DFD8",
  softBlue: "#DCE6F1",
  softOlive: "#E6ECD7",
};

const fonts = {
  title: "Georgia",
  body: "Segoe UI",
  mono: "Consolas",
};

const typeLabels = {
  random: "случайные",
  sorted: "отсорт.",
  reversed: "обратные",
  almost: "почти сорт.",
};

const typeColors = {
  random: colors.coral,
  sorted: colors.teal,
  reversed: colors.blue,
  almost: colors.olive,
};

function heading(textValue, maxWidth = 1480) {
  return text(textValue, {
    name: "slide-title",
    width: wrap(maxWidth),
    height: hug,
    style: {
      fontFace: fonts.title,
      fontSize: 54,
      bold: true,
      color: colors.ink,
    },
  });
}

function subheading(textValue, maxWidth = 1260) {
  return text(textValue, {
    name: "slide-subtitle",
    width: wrap(maxWidth),
    height: hug,
    style: {
      fontFace: fonts.body,
      fontSize: 24,
      color: colors.muted,
    },
  });
}

function footer(sourceText) {
  return row(
    { width: fill, height: hug, justify: "between", align: "center" },
    [
      text(sourceText, {
        name: "source",
        width: wrap(980),
        height: hug,
        style: {
          fontFace: fonts.body,
          fontSize: 12,
          color: colors.muted,
        },
      }),
      text("Stooge Sort | 11-503 | 25.04.2026", {
        name: "footer-meta",
        width: hug,
        height: hug,
        style: {
          fontFace: fonts.body,
          fontSize: 12,
          color: colors.muted,
        },
      }),
    ],
  );
}

function shell(titleText, subtitleText, bodyNode, sourceText, accent = colors.teal) {
  return layers(
    { width: fill, height: fill },
    [
      shape({ name: "bg", width: fill, height: fill, fill: colors.bg }),
      column(
        {
          name: "page",
          width: fill,
          height: fill,
          padding: { x: 88, y: 72 },
          gap: 28,
        },
        [
          heading(titleText),
          subheading(subtitleText),
          rule({ name: "accent-rule", width: fixed(220), stroke: accent, weight: 4 }),
          bodyNode,
          footer(sourceText),
        ],
      ),
    ],
  );
}

function formatMs(value) {
  if (value < 1) return value.toFixed(3);
  if (value < 10) return value.toFixed(2);
  if (value < 100) return value.toFixed(1);
  return value.toFixed(0);
}

function formatOps(value) {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(3)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(3)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

function formatPlateau(plateau) {
  return plateau.from === plateau.to
    ? `${plateau.from}`
    : `${plateau.from}-${plateau.to}`;
}

function bulletList(items, bulletColor = colors.coral, maxWidth = 640) {
  return column(
    { width: fill, height: hug, gap: 18 },
    items.map((item, index) =>
      row(
        { width: fill, height: hug, gap: 16, align: "start" },
        [
          text(`${index + 1}`.padStart(2, "0"), {
            width: fixed(42),
            height: hug,
            style: {
              fontFace: fonts.body,
              fontSize: 18,
              bold: true,
              color: bulletColor,
            },
          }),
          text(item, {
            width: wrap(maxWidth),
            height: hug,
            style: {
              fontFace: fonts.body,
              fontSize: 24,
              color: colors.ink,
            },
          }),
        ],
      ),
    ),
  );
}

function smallMetric(label, value, accent = colors.teal, suffix = "") {
  return column(
    { width: fixed(250), height: hug, gap: 6 },
    [
      text(label, {
        width: fill,
        height: hug,
        style: {
          fontFace: fonts.body,
          fontSize: 16,
          color: colors.muted,
        },
      }),
      text(`${value}${suffix}`, {
        width: fill,
        height: hug,
        style: {
          fontFace: fonts.title,
          fontSize: 42,
          bold: true,
          color: accent,
        },
      }),
    ],
  );
}

function arrayVisual(values, activeStart, activeEnd, accent) {
  const maxValue = Math.max(...values);
  return row(
    { width: fill, height: hug, gap: 24, justify: "between", align: "end" },
    values.map((value, index) => {
      const active = index >= activeStart && index <= activeEnd;
      return column(
        { width: fixed(180), height: hug, gap: 10, align: "center", justify: "end" },
        [
          text(`i=${index}`, {
            width: hug,
            height: hug,
            style: {
              fontFace: fonts.body,
              fontSize: 16,
              color: active ? accent : colors.muted,
            },
          }),
          shape({
            width: fixed(102),
            height: fixed(72 + Math.round((value / maxValue) * 160)),
            fill: active ? accent : colors.line,
            borderRadius: "rounded-sm",
          }),
          text(String(value), {
            width: hug,
            height: hug,
            style: {
              fontFace: fonts.title,
              fontSize: 30,
              bold: true,
              color: active ? colors.ink : colors.muted,
            },
          }),
        ],
      );
    }),
  );
}

function stageSlide(accent, stageTitle, stageSubtitle, values, activeStart, activeEnd, stepText, noteText) {
  return shell(
    stageTitle,
    stageSubtitle,
    grid(
      {
        width: fill,
        height: fill,
        columns: [fr(1.35), fr(0.65)],
        rows: [auto, fr(1)],
        columnGap: 48,
        rowGap: 28,
      },
      [
        column(
          { width: fill, height: hug, gap: 18 },
          [
            text(stepText, {
              width: wrap(1020),
              height: hug,
              style: {
                fontFace: fonts.body,
                fontSize: 28,
                bold: true,
                color: accent,
              },
            }),
            arrayVisual(values, activeStart, activeEnd, accent),
            text(noteText, {
              width: wrap(1060),
              height: hug,
              style: {
                fontFace: fonts.body,
                fontSize: 21,
                color: colors.muted,
              },
            }),
          ],
        ),
        column(
          { width: fill, height: hug, gap: 18 },
          [
            text("Рекурсивный шаблон", {
              width: fill,
              height: hug,
              style: {
                fontFace: fonts.body,
                fontSize: 24,
                bold: true,
                color: colors.ink,
              },
            }),
            text("1) сравнить крайние элементы", {
              width: wrap(420),
              height: hug,
              style: {
                fontFace: fonts.body,
                fontSize: 22,
                color: activeStart === 0 && activeEnd === 4 ? accent : colors.muted,
              },
            }),
            text("2) отсортировать первые 2/3", {
              width: wrap(420),
              height: hug,
              style: {
                fontFace: fonts.body,
                fontSize: 22,
                color: activeStart === 0 && activeEnd === 3 ? accent : colors.muted,
              },
            }),
            text("3) отсортировать последние 2/3", {
              width: wrap(420),
              height: hug,
              style: {
                fontFace: fonts.body,
                fontSize: 22,
                color: activeStart === 1 && activeEnd === 4 ? accent : colors.muted,
              },
            }),
            text("4) снова первые 2/3", {
              width: wrap(420),
              height: hug,
              style: {
                fontFace: fonts.body,
                fontSize: 22,
                color: activeStart === 0 && activeEnd === 3 && accent === colors.teal ? accent : colors.muted,
              },
            }),
            rule({ width: fixed(160), stroke: accent, weight: 3 }),
            text("Для массива из 5 элементов: t = floor(5 / 3) = 1, поэтому рекурсивные диапазоны имеют длину 4.", {
              width: wrap(420),
              height: hug,
              style: {
                fontFace: fonts.body,
                fontSize: 18,
                color: colors.muted,
              },
            }),
          ],
        ),
      ],
    ),
    "Источник: собственная визуализация по реализованному коду Stooge Sort.",
    accent,
  );
}

function tableColumnTitle(titleText, accent) {
  return column(
    { width: fill, height: hug, gap: 10 },
    [
      text(titleText, {
        width: fill,
        height: hug,
        style: {
          fontFace: fonts.body,
          fontSize: 24,
          bold: true,
          color: colors.ink,
        },
      }),
      rule({ width: fixed(180), stroke: accent, weight: 3 }),
    ],
  );
}

function buildMiniTable(titleText, accent, rowsData, valueFormatter) {
  const widths = [120, 142, 142, 142, 162];
  const headers = ["n", "случ.", "сорт.", "обр.", "почти"];
  const bodyRows = rowsData.map((rowData) => [
    String(rowData.size),
    valueFormatter(rowData.random),
    valueFormatter(rowData.sorted),
    valueFormatter(rowData.reversed),
    valueFormatter(rowData.almost),
  ]);

  const makeRow = (values, isHeader = false) =>
    row(
      { width: fill, height: hug, gap: 12, align: "center" },
      values.map((value, index) =>
        text(value, {
          width: fixed(widths[index]),
          height: hug,
          style: {
            fontFace: fonts.body,
            fontSize: isHeader ? 18 : 17,
            bold: isHeader,
            color: isHeader ? accent : colors.ink,
          },
        }),
      ),
    );

  return column(
    { width: fill, height: hug, gap: 14 },
    [
      tableColumnTitle(titleText, accent),
      makeRow(headers, true),
      rule({ width: fill, stroke: colors.line, weight: 2 }),
      ...bodyRows.flatMap((values, index) => [
        makeRow(values, false),
        index === bodyRows.length - 1 ? null : rule({ width: fill, stroke: colors.line, weight: 1 }),
      ]).filter(Boolean),
    ],
  );
}

function chartNode(name, chartType, categories, series, widthPx, heightPx) {
  return chart({
    name,
    chartType,
    width: fixed(widthPx),
    height: fixed(heightPx),
    config: {
      categories,
      series,
    },
  });
}

function staircaseBars() {
  return row(
    { width: fill, height: hug, gap: 18, align: "end", justify: "end" },
    [
      shape({ width: fixed(90), height: fixed(130), fill: colors.softBlue, borderRadius: "rounded-sm" }),
      shape({ width: fixed(90), height: fixed(220), fill: colors.softTeal, borderRadius: "rounded-sm" }),
      shape({ width: fixed(90), height: fixed(320), fill: colors.softCoral, borderRadius: "rounded-sm" }),
      shape({ width: fixed(90), height: fixed(430), fill: colors.softOlive, borderRadius: "rounded-sm" }),
      shape({ width: fixed(90), height: fixed(560), fill: colors.gold, borderRadius: "rounded-sm" }),
    ],
  );
}

async function buildPresentation() {
  const metrics = JSON.parse(await fs.readFile(metricsPath, "utf8"));
  const presentation = Presentation.create({ slideSize });

  const summaryRows = metrics.summaryTableSizes.map((size, index) => ({
    size,
    random: metrics.summaryTable.random[index],
    sorted: metrics.summaryTable.sorted[index],
    reversed: metrics.summaryTable.reversed[index],
    almost: metrics.summaryTable.almost[index],
  }));

  const timeSeries = metrics.types.map((type) => ({
    name: typeLabels[type],
    values: metrics.series[type].timeMs,
    color: typeColors[type],
  }));

  const operationSeries = metrics.types.map((type) => ({
    name: typeLabels[type],
    values: metrics.series[type].operations.map((value) => Number((value / 1_000_000).toFixed(3))),
    color: typeColors[type],
  }));

  const theorySeries = [
    {
      name: "точные вызовы",
      values: metrics.theory.exactCalls.map((value) => Number((value / 1_000_000).toFixed(3))),
      color: colors.teal,
    },
    {
      name: "k·n^2.7095",
      values: metrics.theory.smoothApproximation.map((value) => Number((value / 1_000_000).toFixed(3))),
      color: colors.coral,
    },
  ];

  const slide1 = presentation.slides.add();
  slide1.compose(
    layers(
      { width: fill, height: fill },
      [
        shape({ width: fill, height: fill, fill: colors.bg }),
        grid(
          {
            width: fill,
            height: fill,
            columns: [fr(1.1), fr(0.9)],
            rows: [auto, fr(1), auto],
            columnGap: 36,
            rowGap: 24,
            padding: { x: 88, y: 78 },
          },
          [
            column(
              { width: fill, height: hug, gap: 16 },
              [
                text("Семестровый проект по анализу алгоритмов", {
                  width: fill,
                  height: hug,
                  style: {
                    fontFace: fonts.body,
                    fontSize: 22,
                    color: colors.teal,
                  },
                }),
                text("Stooge Sort", {
                  width: fill,
                  height: hug,
                  style: {
                    fontFace: fonts.title,
                    fontSize: 92,
                    bold: true,
                    color: colors.ink,
                  },
                }),
                text("Экспериментальный анализ времени работы и числа операций", {
                  width: wrap(760),
                  height: hug,
                  style: {
                    fontFace: fonts.body,
                    fontSize: 30,
                    color: colors.muted,
                  },
                }),
                rule({ width: fixed(260), stroke: colors.coral, weight: 4 }),
              ],
            ),
            column(
              { width: fill, height: fill, gap: 24, align: "end", justify: "center" },
              [
                staircaseBars(),
                text("n^2.7095", {
                  width: hug,
                  height: hug,
                  style: {
                    fontFace: fonts.title,
                    fontSize: 74,
                    bold: true,
                    color: colors.blue,
                  },
                }),
                text("ступенчатый рост хорошо виден уже на реальных замерах", {
                  width: wrap(500),
                  height: hug,
                  style: {
                    fontFace: fonts.body,
                    fontSize: 22,
                    color: colors.muted,
                  },
                }),
              ],
            ),
            row(
              { width: fill, height: hug, gap: 38, columnSpan: 2, align: "center" },
              [
                smallMetric("25 размеров входа", metrics.highlights.sizeCount, colors.teal),
                smallMetric("100 подготовленных наборов", metrics.highlights.datasetCount, colors.coral),
                smallMetric("максимум", formatMs(metrics.highlights.maxTimeMs), colors.gold, " мс"),
              ],
            ),
            footer("Источник: задание курса; собственные измерения и реализация на Java."),
          ],
        ),
      ],
    ),
    { frame, baseUnit: 8 },
  );

  const slide2 = presentation.slides.add();
  slide2.compose(
    shell(
      "Что такое Stooge Sort",
      "Неэффективная, но очень показательная рекурсивная сортировка: полезна как учебный антипример и как материал для анализа рекурсии.",
      grid(
        {
          width: fill,
          height: fill,
          columns: [fr(1), fr(1)],
          rows: [fr(1)],
          columnGap: 56,
        },
        [
          column(
            { width: fill, height: hug, gap: 22 },
            [
              text("Краткая справка", {
                width: fill,
                height: hug,
                style: {
                  fontFace: fonts.body,
                  fontSize: 24,
                  bold: true,
                  color: colors.teal,
                },
              }),
              text("Stooge Sort известен как намеренно неэффективный рекурсивный алгоритм. Его часто приводят не ради практического применения, а ради демонстрации того, как дискретная рекурсия рождает необычные графики и плохую асимптотику.", {
                width: wrap(760),
                height: hug,
                style: {
                  fontFace: fonts.body,
                  fontSize: 24,
                  color: colors.ink,
                },
              }),
              text("Название отсылает к комедийному трио The Three Stooges: три одинаковых рекурсивных вызова выглядят почти пародийно, но идеально подходят для учебного анализа.", {
                width: wrap(760),
                height: hug,
                style: {
                  fontFace: fonts.body,
                  fontSize: 22,
                  color: colors.muted,
                },
              }),
              rule({ width: fixed(180), stroke: colors.coral, weight: 3 }),
              text("Идея работы", {
                width: fill,
                height: hug,
                style: {
                  fontFace: fonts.body,
                  fontSize: 24,
                  bold: true,
                  color: colors.coral,
                },
              }),
              bulletList(
                [
                  "сначала сравниваются крайние элементы текущего диапазона;",
                  "если левый больше правого, выполняется обмен;",
                  "затем рекурсивно сортируются первые 2/3, последние 2/3 и снова первые 2/3.",
                ],
                colors.coral,
                700,
              ),
            ],
          ),
          column(
            { width: fill, height: hug, gap: 22 },
            [
              text("Ключевые свойства", {
                width: fill,
                height: hug,
                style: {
                  fontFace: fonts.body,
                  fontSize: 24,
                  bold: true,
                  color: colors.blue,
                },
              }),
              bulletList(
                [
                  "асимптотика намного хуже, чем у Merge Sort, Quick Sort или Heap Sort;",
                  "использует сортировку «на месте» по массиву, но платит за это глубокой рекурсией;",
                  "на отсортированных данных почти не делает обменов, но число вызовов остаётся огромным;",
                  "лучше всего подходит для демонстрации рекуррентных соотношений и сравнения теории с практикой.",
                ],
                colors.blue,
                700,
              ),
            ],
          ),
        ],
      ),
      "Источник: NIST Dictionary of Algorithms and Data Structures; собственная реализация.",
      colors.teal,
    ),
    { frame, baseUnit: 8 },
  );

  const slide3 = presentation.slides.add();
  slide3.compose(
    stageSlide(
      colors.coral,
      "Пошаговая визуализация: шаг 1/4",
      "Стартуем с короткого примера, чтобы было видно саму механику рекурсии.",
      [1, 4, 5, 3, 2],
      0,
      4,
      "Сначала сравниваются крайние элементы диапазона [0..4]. В примере 2 > 1, поэтому крайние значения меняются местами.",
      "После первого сравнения крайние элементы уже ближе к своим местам. Но этого недостаточно: дальше нужно трижды пройти по перекрывающимся 2/3 диапазонам.",
    ),
    { frame, baseUnit: 8 },
  );

  const slide4 = presentation.slides.add();
  slide4.compose(
    stageSlide(
      colors.teal,
      "Пошаговая визуализация: шаг 2/4",
      "Теперь алгоритм заходит в первый рекурсивный поддиапазон длиной 4.",
      [1, 3, 4, 5, 2],
      0,
      3,
      "Первый рекурсивный вызов сортирует первые 2/3 массива: диапазон [0..3]. Внутри него повторяется та же самая схема.",
      "Из-за такого повторения Stooge Sort быстро накапливает огромное число вызовов. Даже когда массив почти упорядочен, рекурсивная структура никуда не исчезает.",
    ),
    { frame, baseUnit: 8 },
  );

  const slide5 = presentation.slides.add();
  slide5.compose(
    stageSlide(
      colors.blue,
      "Пошаговая визуализация: шаг 3/4",
      "Второй рекурсивный вызов идёт по последним 2/3 исходного диапазона.",
      [1, 2, 3, 4, 5],
      1,
      4,
      "После обработки диапазона [1..4] все элементы уже оказываются на нужных местах. На маленьком примере это случается довольно рано.",
      "Именно перекрытие диапазонов делает алгоритм детерминированным, но визуально «неровным»: многие близкие n порождают одинаковый рисунок вызовов.",
    ),
    { frame, baseUnit: 8 },
  );

  const slide6 = presentation.slides.add();
  slide6.compose(
    stageSlide(
      colors.teal,
      "Пошаговая визуализация: шаг 4/4",
      "Финальный проход по первым 2/3 подтверждает отсортированность.",
      [1, 2, 3, 4, 5],
      0,
      3,
      "Третий рекурсивный вызов снова обрабатывает диапазон [0..3]. На этом примере массив уже отсортирован, поэтому изменений больше нет.",
      "На демонстрации это удобно показывать кликами: каждый следующий слайд сдвигает активный диапазон и объясняет, почему алгоритм делает именно три рекурсивных шага.",
    ),
    { frame, baseUnit: 8 },
  );

  const slide7 = presentation.slides.add();
  slide7.compose(
    shell(
      "Теория, асимптотика и смысл аппроксимации",
      "Теория уже говорит, что Stooge Sort очень медленный. Эксперимент нужен не для «открытия» сложности, а для проверки формы роста на реальных замерах.",
      grid(
        {
          width: fill,
          height: fill,
          columns: [fr(1.1), fr(0.9)],
          columnGap: 52,
        },
        [
          column(
            { width: fill, height: hug, gap: 18 },
            [
              text("Рекуррентное соотношение", {
                width: fill,
                height: hug,
                style: {
                  fontFace: fonts.body,
                  fontSize: 24,
                  bold: true,
                  color: colors.teal,
                },
              }),
              text("T(n) = 3T(2n / 3) + O(1)", {
                width: fill,
                height: hug,
                style: {
                  fontFace: fonts.mono,
                  fontSize: 34,
                  bold: true,
                  color: colors.ink,
                },
              }),
              text("По Master theorem получаем показатель степени log_(3/2)(3) ≈ 2.7095, поэтому теоретическая временная сложность записывается как O(n^2.7095).", {
                width: wrap(840),
                height: hug,
                style: {
                  fontFace: fonts.body,
                  fontSize: 24,
                  color: colors.ink,
                },
              }),
              text("Почему тогда мы всё равно рисуем кривую k·n^2.7095?", {
                width: fill,
                height: hug,
                style: {
                  fontFace: fonts.body,
                  fontSize: 24,
                  bold: true,
                  color: colors.coral,
                },
              }),
              bulletList(
                [
                  "O(n^2.7095) задаёт только класс роста, но не единицы измерения в миллисекундах;",
                  "коэффициент k подгоняет теоретическую форму к масштабу реальных данных;",
                  "поэтому «аппроксимация» здесь означает не замену теории, а перенос её в реальные оси графика.",
                ],
                colors.coral,
                760,
              ),
            ],
          ),
          column(
            { width: fill, height: hug, gap: 18, justify: "center" },
            [
              text("2.7095", {
                width: fill,
                height: hug,
                style: {
                  fontFace: fonts.title,
                  fontSize: 104,
                  bold: true,
                  color: colors.blue,
                },
              }),
              text("показатель теоретического роста", {
                width: wrap(420),
                height: hug,
                style: {
                  fontFace: fonts.body,
                  fontSize: 24,
                  color: colors.muted,
                },
              }),
              rule({ width: fixed(180), stroke: colors.blue, weight: 3 }),
              text("Почему эксперимент может отклоняться", {
                width: fill,
                height: hug,
                style: {
                  fontFace: fonts.body,
                  fontSize: 24,
                  bold: true,
                  color: colors.blue,
                },
              }),
              bulletList(
                [
                  "целочисленное деление n / 3 делает рекурсию дискретной;",
                  "замеры времени содержат константы JVM: прогрев, кеши, планирование процессора;",
                  "на конечном диапазоне размеров теория видна, но не обязана совпадать точка в точку.",
                ],
                colors.blue,
                420,
              ),
            ],
          ),
        ],
      ),
      "Источник: собственная реализация; теоретическая оценка по рекуррентному соотношению Stooge Sort.",
      colors.teal,
    ),
    { frame, baseUnit: 8 },
  );

  const slide8 = presentation.slides.add();
  slide8.compose(
    shell(
      "Экспериментальная постановка",
      "Диапазон выбрали так, чтобы график был и наглядным, и выполнимым по времени: ранний рост виден уже на сотнях элементов, а к 2400-2500 алгоритм становится по-настоящему тяжёлым.",
      grid(
        {
          width: fill,
          height: fill,
          columns: [fr(0.9), fr(1.1)],
          columnGap: 64,
        },
        [
          column(
            { width: fill, height: hug, gap: 22 },
            [
              smallMetric("размеры входа", "100..2500", colors.teal),
              smallMetric("шаг", "100", colors.coral),
              smallMetric("подготовленных наборов", metrics.highlights.datasetCount, colors.gold),
              text("Почему именно так:", {
                width: fill,
                height: hug,
                style: {
                  fontFace: fonts.body,
                  fontSize: 24,
                  bold: true,
                  color: colors.ink,
                },
              }),
              bulletList(
                [
                  "25 размеров × 4 типа данных = ровно 100 заранее подготовленных наборов;",
                  "шаг 100 делает графики читаемыми и не распиливает ось X на лишний шум;",
                  "верхняя граница 2500 уже даёт время около 1.4 с на один прогон, чего достаточно для демонстрации взрывного роста.",
                ],
                colors.coral,
                650,
              ),
            ],
          ),
          column(
            { width: fill, height: hug, gap: 22 },
            [
              text("Типы входных данных", {
                width: fill,
                height: hug,
                style: {
                  fontFace: fonts.body,
                  fontSize: 24,
                  bold: true,
                  color: colors.blue,
                },
              }),
              bulletList(
                [
                  "случайные числа;",
                  "отсортированный массив;",
                  "массив в обратном порядке;",
                  "почти отсортированный массив с небольшим числом обменов.",
                ],
                colors.blue,
                620,
              ),
              rule({ width: fixed(200), stroke: colors.blue, weight: 3 }),
              text("Как считались метрики", {
                width: fill,
                height: hug,
                style: {
                  fontFace: fonts.body,
                  fontSize: 24,
                  bold: true,
                  color: colors.ink,
                },
              }),
              text("Время усреднялось по 5 запускам после 2 прогревов JVM. Операционный счётчик фиксировал рекурсивные вызовы и успешные обмены; для одного и того же входа он детерминирован.", {
                width: wrap(720),
                height: hug,
                style: {
                  fontFace: fonts.body,
                  fontSize: 22,
                  color: colors.muted,
                },
              }),
            ],
          ),
        ],
      ),
      "Источник: файл задания; собственный конфиг эксперимента и файл results.xlsx.",
      colors.coral,
    ),
    { frame, baseUnit: 8 },
  );

  const slide9 = presentation.slides.add();
  slide9.compose(
    shell(
      "Реперные таблицы измерений",
      "Показываю несколько характерных размеров: ранний участок, первый крупный скачок и область, где один прогон уже занимает почти полторы секунды.",
      column(
        { width: fill, height: fill, gap: 24 },
        [
          row(
            { width: fill, height: hug, gap: 42, align: "start" },
            [
              buildMiniTable(
                "Среднее время, мс",
                colors.coral,
                summaryRows,
                (entry) => formatMs(entry.time_ms),
              ),
              buildMiniTable(
                "Операции, calls + swaps",
                colors.teal,
                summaryRows,
                (entry) => formatOps(entry.operations),
              ),
            ],
          ),
          text("Полный набор из 100 измерений сохранён в results.xlsx; на слайде оставлены только реперные точки, чтобы таблицы можно было прочитать во время выступления.", {
            width: wrap(1500),
            height: hug,
            style: {
              fontFace: fonts.body,
              fontSize: 18,
              color: colors.muted,
            },
          }),
        ],
      ),
      "Источник: results.xlsx, листы Results / TimeMsByType / OperationsByType.",
      colors.teal,
    ),
    { frame, baseUnit: 8 },
  );

  const slide10 = presentation.slides.add();
  slide10.compose(
    shell(
      "Время выполнения",
      "У всех четырёх типов входа форма роста почти совпадает: различается в основном постоянный множитель.",
      column(
        { width: fill, height: fill, gap: 24 },
        [
          chartNode(
            "time-chart",
            "line",
            metrics.sizes.map(String),
            timeSeries,
            1620,
            620,
          ),
          text("После 1600 элементов один прогон уже стоит примерно 0.76-0.80 с, а к 2400-2500 достигает 1.37-1.41 с. Поэтому диапазон 100..2500 оказался достаточным для демонстрации роста.", {
            width: wrap(1500),
            height: hug,
            style: {
              fontFace: fonts.body,
              fontSize: 18,
              color: colors.muted,
            },
          }),
        ],
      ),
      "Источник: собственные замеры времени из results.xlsx.",
      colors.coral,
    ),
    { frame, baseUnit: 8 },
  );

  const slide11 = presentation.slides.add();
  slide11.compose(
    shell(
      "Число операций",
      "Главный вклад даёт рекурсивная структура. Разница между типами входа заметна, но намного меньше общего роста по n.",
      column(
        { width: fill, height: fill, gap: 24 },
        [
          chartNode(
            "operations-chart",
            "line",
            metrics.sizes.map(String),
            operationSeries,
            1620,
            620,
          ),
          text(`На размере 2500 у обратного массива обмены доходят до ${formatOps(metrics.highlights.maxSwapsReversed2500)}, но это всё равно малая добавка к ${formatOps(metrics.highlights.maxOperations)} общих операций. Поэтому кривые почти совпадают по форме.`, {
            width: wrap(1500),
            height: hug,
            style: {
              fontFace: fonts.body,
              fontSize: 18,
              color: colors.muted,
            },
          }),
        ],
      ),
      "Источник: собственные измерения операционного счётчика.",
      colors.teal,
    ),
    { frame, baseUnit: 8 },
  );

  const slide12 = presentation.slides.add();
  slide12.compose(
    shell(
      "Теория против эксперимента: откуда берутся «ступеньки»",
      "Stooge Sort детерминированный, но его точное число вызовов меняется не плавно, а скачками: это и создаёт характерную «лестницу» на графике.",
      grid(
        {
          width: fill,
          height: fill,
          columns: [fr(1.1), fr(0.9)],
          columnGap: 48,
        },
        [
          column(
            { width: fill, height: hug, gap: 18 },
            [
              chartNode(
                "theory-chart",
                "line",
                metrics.sizes.map(String),
                theorySeries,
                960,
                610,
              ),
              text("Гладкая кривая показывает только асимптотическую форму k·n^2.7095. Точная дискретная модель считает реальные рекурсивные вызовы и поэтому образует плато.", {
                width: wrap(900),
                height: hug,
                style: {
                  fontFace: fonts.body,
                  fontSize: 20,
                  color: colors.muted,
                },
              }),
            ],
          ),
          column(
            { width: fill, height: hug, gap: 18 },
            [
              text("Почему возникают скачки", {
                width: fill,
                height: hug,
                style: {
                  fontFace: fonts.body,
                  fontSize: 24,
                  bold: true,
                  color: colors.coral,
                },
              }),
              bulletList(
                [
                  "в коде используется t = floor(n / 3), поэтому соседние размеры часто переходят в один и тот же следующий подразмер;",
                  "из-за этого для целых интервалов n структура рекурсивного дерева не меняется;",
                  "время повторяет ту же форму, но поверх ступеней накладываются шумы JVM и подсистемы памяти.",
                ],
                colors.coral,
                620,
              ),
              rule({ width: fixed(170), stroke: colors.coral, weight: 3 }),
              text("Плато точного числа вызовов", {
                width: fill,
                height: hug,
                style: {
                  fontFace: fonts.body,
                  fontSize: 24,
                  bold: true,
                  color: colors.blue,
                },
              }),
              ...metrics.theory.plateaus.slice(4).map((plateau) =>
                text(`${formatPlateau(plateau)} -> ${formatOps(plateau.calls)}`, {
                  width: wrap(560),
                  height: hug,
                  style: {
                    fontFace: fonts.mono,
                    fontSize: 19,
                    color: colors.ink,
                  },
                }),
              ),
            ],
          ),
        ],
      ),
      "Источник: лист Theory в results.xlsx; точная дискретная модель вызовов для реализованного кода.",
      colors.blue,
    ),
    { frame, baseUnit: 8 },
  );

  const slide13 = presentation.slides.add();
  slide13.compose(
    shell(
      "Выводы, применимость и код",
      "Stooge Sort отлично подходит для демонстрации рекурсии и сравнения теории с практикой, но почти никогда не выигрывает как инженерный инструмент.",
      grid(
        {
          width: fill,
          height: fill,
          columns: [fr(1), fr(1)],
          columnGap: 56,
        },
        [
          column(
            { width: fill, height: hug, gap: 22 },
            [
              text("Плюсы", {
                width: fill,
                height: hug,
                style: {
                  fontFace: fonts.body,
                  fontSize: 24,
                  bold: true,
                  color: colors.teal,
                },
              }),
              bulletList(
                [
                  "наглядно показывает силу и цену рекурсии;",
                  "удобен для обсуждения асимптотики и дискретных рекуррентных моделей;",
                  "хорошо иллюстрирует, почему гладкая теория и реальные графики не обязаны совпадать точка в точку.",
                ],
                colors.teal,
                700,
              ),
              text("Минусы и ограничения", {
                width: fill,
                height: hug,
                style: {
                  fontFace: fonts.body,
                  fontSize: 24,
                  bold: true,
                  color: colors.coral,
                },
              }),
              bulletList(
                [
                  "очень высокая временная сложность O(n^2.7095);",
                  "практически бесполезен на больших массивах;",
                  "даже на отсортированных данных число вызовов остаётся колоссальным.",
                ],
                colors.coral,
                700,
              ),
            ],
          ),
          column(
            { width: fill, height: hug, gap: 22 },
            [
              text("Когда применять", {
                width: fill,
                height: hug,
                style: {
                  fontFace: fonts.body,
                  fontSize: 24,
                  bold: true,
                  color: colors.blue,
                },
              }),
              text("Только в учебных целях: для семинара, разбора рекурсии, демонстрации антипримеров или сравнения с нормальными алгоритмами сортировки.", {
                width: wrap(660),
                height: hug,
                style: {
                  fontFace: fonts.body,
                  fontSize: 24,
                  color: colors.ink,
                },
              }),
              rule({ width: fixed(180), stroke: colors.blue, weight: 3 }),
              text("Код проекта", {
                width: fill,
                height: hug,
                style: {
                  fontFace: fonts.body,
                  fontSize: 24,
                  bold: true,
                  color: colors.blue,
                },
              }),
              text("Локальная копия: C:\\ITIS_AISD\\semestrovaya", {
                width: wrap(650),
                height: hug,
                style: {
                  fontFace: fonts.mono,
                  fontSize: 22,
                  color: colors.ink,
                },
              }),
              text("После публикации на GitHub эту строку нужно заменить на URL репозитория.", {
                width: wrap(650),
                height: hug,
                style: {
                  fontFace: fonts.body,
                  fontSize: 20,
                  color: colors.muted,
                },
              }),
              text("Главный итог", {
                width: fill,
                height: hug,
                style: {
                  fontFace: fonts.body,
                  fontSize: 24,
                  bold: true,
                  color: colors.gold,
                },
              }),
              text("Stooge Sort — плохой алгоритм для практики, но очень хороший алгоритм для объяснения того, как теория встречается с экспериментом.", {
                width: wrap(680),
                height: hug,
                style: {
                  fontFace: fonts.title,
                  fontSize: 34,
                  bold: true,
                  color: colors.ink,
                },
              }),
            ],
          ),
        ],
      ),
      "Источник: собственная реализация и экспериментальные результаты проекта.",
      colors.teal,
    ),
    { frame, baseUnit: 8 },
  );

  return presentation;
}

async function exportAndRender() {
  await fs.mkdir(outputDir, { recursive: true });
  await fs.mkdir(previewDir, { recursive: true });

  const presentation = await buildPresentation();
  const outPath = path.join(outputDir, "output.pptx");
  const blob = await PresentationFile.exportPptx(presentation);
  await blob.save(outPath);

  const pptxBytes = await fs.readFile(outPath);
  const imported = await PresentationFile.importPptx(pptxBytes);
  const previewPaths = [];

  for (let index = 0; index < imported.slides.items.length; index += 1) {
    const slide = imported.slides.items[index];
    const canvas = new Canvas(slideSize.width, slideSize.height);
    const ctx = canvas.getContext("2d");
    await drawSlideToCtx(slide, imported, ctx);
    const previewPath = path.join(previewDir, `slide-${String(index + 1).padStart(2, "0")}.png`);
    await fs.writeFile(previewPath, await canvas.png);
    previewPaths.push(previewPath);
  }

  await fs.writeFile(
    path.join(scratchDir, "preview-manifest.json"),
    JSON.stringify({ pptx: outPath, previews: previewPaths }, null, 2),
    "utf8",
  );

  console.log(JSON.stringify({ pptx: outPath, previews: previewPaths }, null, 2));
}

await exportAndRender();
