import { METRIC_META, levelOf, type MetricKey, type PostureMeasurement } from "./posture-types";

export type ExerciseCategory = "둔근 강화" | "고관절 가동성" | "코어 안정화" | "스트레칭";

export interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  /** Metrics this exercise is commonly suggested for. */
  targets: MetricKey[];
  durationLabel: string;
  sets: string;
  howTo: string[];
  cautions: string;
}

export const EXERCISES: Exercise[] = [
  {
    id: "glute-bridge",
    name: "글루트 브릿지",
    category: "둔근 강화",
    targets: ["pelvisHeightDiff", "weightShift"],
    durationLabel: "약 3분",
    sets: "12회 × 3세트",
    howTo: [
      "무릎을 세우고 바르게 눕습니다. 발은 골반 너비로 둡니다.",
      "숨을 내쉬며 엉덩이를 들어 올려 몸통과 허벅지가 일직선이 되게 합니다.",
      "엉덩이에 힘이 들어오는 느낌을 2초 유지한 뒤 천천히 내립니다.",
    ],
    cautions: "허리로 밀어 올리지 않도록 하고, 허리에 불편감이 생기면 중단하세요.",
  },
  {
    id: "clamshell",
    name: "클램쉘",
    category: "둔근 강화",
    targets: ["pelvisRotation", "pelvisHeightDiff"],
    durationLabel: "약 3분",
    sets: "좌우 15회 × 2세트",
    howTo: [
      "옆으로 누워 무릎을 90도 정도 구부립니다.",
      "발뒤꿈치는 붙인 상태로 위쪽 무릎만 천천히 벌립니다.",
      "골반이 뒤로 눕지 않게 유지하며 제자리로 돌아옵니다.",
    ],
    cautions: "속도보다 골반 고정이 중요합니다. 양쪽 횟수를 같게 맞추세요.",
  },
  {
    id: "hip-flexor-stretch",
    name: "장요근(고관절 앞) 스트레칭",
    category: "고관절 가동성",
    targets: ["pelvisRotation", "trunkTilt"],
    durationLabel: "좌우 각 60초",
    sets: "2세트",
    howTo: [
      "한쪽 무릎을 바닥에 대고 런지 자세를 만듭니다.",
      "꼬리뼈를 아래로 말아 넣으며 골반을 앞으로 가볍게 밉니다.",
      "앞쪽 허벅지가 당겨지는 지점에서 호흡하며 머무릅니다.",
    ],
    cautions: "허리를 꺾어 통증을 만들지 않도록 범위를 조절하세요.",
  },
  {
    id: "hip-90-90",
    name: "90/90 고관절 회전",
    category: "고관절 가동성",
    targets: ["pelvisRotation"],
    durationLabel: "약 4분",
    sets: "좌우 10회 × 2세트",
    howTo: [
      "앉은 상태에서 양 무릎을 90도로 만들어 한쪽으로 둡니다.",
      "상체를 세운 채 무릎을 반대쪽으로 천천히 넘깁니다.",
      "덜 넘어가는 쪽을 조금 더 반복합니다.",
    ],
    cautions: "무릎 안쪽에 통증이 있으면 가동 범위를 줄이세요.",
  },
  {
    id: "dead-bug",
    name: "데드버그",
    category: "코어 안정화",
    targets: ["trunkTilt", "pelvisRotation"],
    durationLabel: "약 4분",
    sets: "좌우 8회 × 3세트",
    howTo: [
      "누운 상태에서 팔과 무릎을 천장 방향으로 들어 올립니다.",
      "허리와 바닥 사이 공간을 유지하며 반대쪽 팔과 다리를 폅니다.",
      "숨을 내쉬면서 천천히 제자리로 돌아옵니다.",
    ],
    cautions: "허리가 바닥에서 들리면 범위를 줄여 진행하세요.",
  },
  {
    id: "side-plank",
    name: "사이드 플랭크 (무릎 지지)",
    category: "코어 안정화",
    targets: ["trunkTilt", "shoulderHeightDiff"],
    durationLabel: "좌우 각 20~30초",
    sets: "2세트",
    howTo: [
      "옆으로 누워 아래쪽 팔꿈치와 무릎으로 지지합니다.",
      "골반을 들어 머리-몸통-무릎이 일직선이 되게 합니다.",
      "호흡을 멈추지 않고 유지합니다.",
    ],
    cautions: "어깨에 찌릿한 통증이 있으면 즉시 중단하세요.",
  },
  {
    id: "hamstring-stretch",
    name: "햄스트링 스트레칭",
    category: "스트레칭",
    targets: ["pelvisHeightDiff", "weightShift"],
    durationLabel: "좌우 각 45초",
    sets: "2세트",
    howTo: [
      "한쪽 발을 앞으로 뻗고 발끝을 세웁니다.",
      "허리를 둥글게 말지 않고 골반부터 접어 상체를 숙입니다.",
      "허벅지 뒤쪽이 당겨지는 지점에서 호흡합니다.",
    ],
    cautions: "다리 뒤쪽에 저릿한 감각이 퍼지면 멈추세요.",
  },
  {
    id: "wall-angel",
    name: "월 엔젤 (어깨 정렬)",
    category: "스트레칭",
    targets: ["shoulderHeightDiff", "trunkTilt"],
    durationLabel: "약 3분",
    sets: "10회 × 2세트",
    howTo: [
      "벽에 등과 머리를 대고 서서 팔을 L자로 벽에 붙입니다.",
      "팔을 벽에서 떼지 않고 천천히 위로 올립니다.",
      "허리가 벽에서 과하게 들리지 않게 유지합니다.",
    ],
    cautions: "어깨를 들어 올리는 보상 동작이 생기면 범위를 줄이세요.",
  },
];

export interface ExerciseRecommendation {
  exercise: Exercise;
  reason: string;
  priority: number;
}

/** Recommend exercises based on the metrics that stand out in a measurement. */
export function recommendExercises(m: PostureMeasurement | null): ExerciseRecommendation[] {
  if (!m) {
    return EXERCISES.slice(0, 4).map((exercise, i) => ({
      exercise,
      reason: "측정 전 기본 추천 루틴입니다.",
      priority: 4 - i,
    }));
  }

  const scored = EXERCISES.map((exercise) => {
    let priority = 0;
    const reasons: string[] = [];
    for (const key of exercise.targets) {
      const value = m.metrics.find((v) => v.key === key)?.value ?? 0;
      const level = levelOf(key, value);
      if (level === "observe") {
        priority += 3;
        reasons.push(`${METRIC_META[key].label} 관찰 필요`);
      } else if (level === "moderate") {
        priority += 1.5;
        reasons.push(`${METRIC_META[key].label} 약간의 차이`);
      }
    }
    const reason = reasons.length
      ? `${reasons.join(" · ")} 결과와 관련해 추천됩니다.`
      : "균형 유지를 위한 기본 루틴입니다.";
    return { exercise, reason, priority };
  });

  return scored.sort((a, b) => b.priority - a.priority).slice(0, 6);
}
