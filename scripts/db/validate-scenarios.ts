/**
 * 시나리오 JSON 파일을 체크리스트 기반으로 검증하는 스크립트
 *
 * 사용법:
 *   pnpm db:validate-scenarios
 *   pnpm db:validate-scenarios --file docs/contents/scenarios/14-old-friend-borrow-money.json
 *   pnpm db:validate-scenarios --dir docs/contents/scenarios/
 */

import fs from 'fs';
import path from 'path';

interface Panel {
  panel: number;
  location: string;
  dialogue: Record<string, string>;
  composition: string;
}

interface ScenarioFile {
  hotpick_id: number;
  hotpick_title?: string;
  hotpick_options?: string[];
  hotpick_type?: string;
  character?: Array<{ name: string; gender: string; appearance: string }>;
  panels: Panel[];
}

interface ValidationResult {
  hotpick_id: number;
  title: string;
  passed: number;
  failed: number;
  warnings: number;
  issues: Array<{ rule: string; severity: 'error' | 'warning'; message: string }>;
}

function validateScenario(scenario: ScenarioFile): ValidationResult {
  const issues: ValidationResult['issues'] = [];
  const title = scenario.hotpick_title || `Hotpick #${scenario.hotpick_id}`;

  // Rule 1: 최소 4컷 이상
  if (scenario.panels.length < 4) {
    issues.push({
      rule: '#1 최소 4컷',
      severity: 'error',
      message: `${scenario.panels.length}컷 (최소 4컷 필요)`,
    });
  }

  // Rule 2: 마지막 컷이 선택지 제시
  const lastPanel = scenario.panels[scenario.panels.length - 1];
  const hasNarration =
    lastPanel &&
    Object.keys(lastPanel.dialogue).some((k) => k === '나레이션' || k.includes('나레이션'));
  if (!hasNarration) {
    issues.push({
      rule: '#2 마지막 컷 선택지',
      severity: 'error',
      message: '마지막 컷에 나레이션 없음',
    });
  }

  // Rule 3: 모든 선택지가 마지막 컷 composition에 포함
  if (scenario.hotpick_options && lastPanel) {
    for (const option of scenario.hotpick_options) {
      if (!lastPanel.composition.includes(option)) {
        issues.push({
          rule: '#3 선택지 포함',
          severity: 'warning',
          message: `마지막 컷 구도에 선택지 "${option}" 미포함 (간접 표현 가능)`,
        });
      }
    }
  }

  // Rule 5: 갈등이 2컷 이내에 드러나는가
  // 첫 2컷의 dialogue에 갈등 키워드 확인 (속마음, 효과음 등)
  const first2Panels = scenario.panels.slice(0, 2);
  const hasConflictEarly = first2Panels.some((p) => {
    const dialogueText = Object.values(p.dialogue).join(' ');
    const keys = Object.keys(p.dialogue);
    return (
      keys.some((k) => k.includes('속마음')) ||
      dialogueText.includes('?') ||
      dialogueText.includes('...') ||
      dialogueText.includes('!') ||
      keys.length >= 2
    );
  });
  if (!hasConflictEarly) {
    issues.push({
      rule: '#5 갈등 속도',
      severity: 'warning',
      message: '첫 2컷에서 갈등 요소 미감지',
    });
  }

  // Rule 8: 구도에 카메라 샷 명시
  const shotKeywords = [
    '풀 샷',
    '풀샷',
    '미디엄 샷',
    '미디엄샷',
    '클로즈업',
    '버드아이뷰',
    '분할',
    '스플릿',
    '그리드',
  ];
  for (const panel of scenario.panels) {
    const hasShot = shotKeywords.some((kw) => panel.composition.includes(kw));
    if (!hasShot) {
      issues.push({
        rule: '#8 카메라 샷',
        severity: 'warning',
        message: `Panel ${panel.panel}: 구도에 카메라 샷 키워드 없음`,
      });
    }
  }

  // Rule 9: 감정 표현이 괄호로
  for (const panel of scenario.panels) {
    for (const [key, value] of Object.entries(panel.dialogue)) {
      if (key === '효과음' || key === '나레이션') {
        continue;
      }
      // 대사가 있고, 괄호 감정 표현이 없는 경우 (짧은 대사 제외)
      if (
        value.length > 10 &&
        !value.includes('(') &&
        !key.includes('속마음') &&
        !key.includes('카톡')
      ) {
        issues.push({
          rule: '#9 감정 괄호',
          severity: 'warning',
          message: `Panel ${panel.panel} "${key}": 감정/동작 괄호 표현 없음`,
        });
      }
    }
  }

  // Rule 10: 장소가 구체적인가
  const vagueLocations = ['밖', '어딘가', '장소'];
  for (const panel of scenario.panels) {
    if (panel.location === '배경 없음 (연출 컷)') {
      continue;
    }
    if (vagueLocations.includes(panel.location) || panel.location.length <= 1) {
      issues.push({
        rule: '#10 구체적 장소',
        severity: 'warning',
        message: `Panel ${panel.panel}: 장소가 모호함 ("${panel.location}")`,
      });
    }
  }

  // Rule 11: dialogue에 중복 키 (JSON 파싱 후에는 탐지 불가, 파일 레벨에서만 가능)
  // → 여기서는 접미사 패턴 확인으로 대체

  // Rule 12: IMAGE 타입이면 마지막 컷에 이미지 관련 키워드
  if (scenario.hotpick_type === 'IMAGE' && lastPanel) {
    const imageKeywords = ['이미지', '사진', 'VS', 'vs', '마크'];
    const hasImageRef = imageKeywords.some((kw) => lastPanel.composition.includes(kw));
    if (!hasImageRef) {
      issues.push({
        rule: '#12 IMAGE 활용',
        severity: 'error',
        message: 'IMAGE 타입인데 마지막 컷에 이미지 관련 연출 없음',
      });
    }
  }

  // 대사 길이 검증
  for (const panel of scenario.panels) {
    for (const [key, value] of Object.entries(panel.dialogue)) {
      if (key === '효과음' || key === '나레이션') {
        continue;
      }
      if (value.length > 50) {
        issues.push({
          rule: '대사 길이',
          severity: 'warning',
          message: `Panel ${panel.panel} "${key}": 대사 ${value.length}자 (권장 30자 이내)`,
        });
      }
    }
  }

  // 캐릭터 설정 존재 여부
  if (!scenario.character || scenario.character.length === 0) {
    issues.push({
      rule: '캐릭터 설정',
      severity: 'warning',
      message: '캐릭터 설정(character) 없음',
    });
  }

  const errorCount = issues.filter((i) => i.severity === 'error').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;
  const totalChecks = 12;
  const passed = totalChecks - errorCount;

  return {
    hotpick_id: scenario.hotpick_id,
    title,
    passed,
    failed: errorCount,
    warnings: warningCount,
    issues,
  };
}

/** Raw JSON에서 dialogue 블록 내 중복 키를 탐지 */
function checkDuplicateKeys(filePath: string): string[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const issues: string[] = [];

  const dialogueRegex = /"dialogue"\s*:\s*\{([^}]*)\}/g;
  let match;
  let blockIdx = 0;
  while ((match = dialogueRegex.exec(content)) !== null) {
    blockIdx++;
    const block = match[1];
    const keyRegex = /"([^"]+)"\s*:/g;
    const keys: string[] = [];
    let keyMatch;
    while ((keyMatch = keyRegex.exec(block)) !== null) {
      const key = keyMatch[1];
      if (keys.includes(key)) {
        issues.push(`dialogue 블록 ${blockIdx}에 중복 키: "${key}"`);
      }
      keys.push(key);
    }
  }
  return issues;
}

function loadScenarios(filePath: string): { scenarios: ScenarioFile[]; duplicateIssues: string[] } {
  const duplicateIssues = checkDuplicateKeys(filePath);
  const content = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(content);
  return { scenarios: Array.isArray(data) ? data : [data], duplicateIssues };
}

function main() {
  const args = process.argv.slice(2);
  let scenarios: ScenarioFile[] = [];

  const fileIdx = args.indexOf('--file');
  const dirIdx = args.indexOf('--dir');

  let allDuplicateIssues: string[] = [];

  if (fileIdx !== -1 && args[fileIdx + 1]) {
    const filePath = path.resolve(args[fileIdx + 1]);
    const result = loadScenarios(filePath);
    scenarios = result.scenarios;
    allDuplicateIssues = result.duplicateIssues;
  } else if (dirIdx !== -1 && args[dirIdx + 1]) {
    const dirPath = path.resolve(args[dirIdx + 1]);
    const files = fs.readdirSync(dirPath).filter((f) => f.endsWith('.json'));
    for (const file of files) {
      const result = loadScenarios(path.join(dirPath, file));
      scenarios.push(...result.scenarios);
      allDuplicateIssues.push(...result.duplicateIssues);
    }
  } else {
    const defaultDir = path.resolve(__dirname, '../../docs/contents/scenarios');
    const files = fs.readdirSync(defaultDir).filter((f) => f.endsWith('.json'));
    for (const file of files) {
      const result = loadScenarios(path.join(defaultDir, file));
      scenarios.push(...result.scenarios);
      allDuplicateIssues.push(...result.duplicateIssues);
    }
  }

  if (allDuplicateIssues.length > 0) {
    console.log('\n🚨 JSON 중복 키 발견:\n');
    for (const issue of allDuplicateIssues) {
      console.log(`   ❌ ${issue}`);
    }
    console.log();
  }

  console.log(`🔍 Validating ${scenarios.length} scenarios\n`);

  let totalErrors = allDuplicateIssues.length;
  let totalWarnings = 0;

  for (const scenario of scenarios) {
    const result = validateScenario(scenario);
    totalErrors += result.failed;
    totalWarnings += result.warnings;

    const icon = result.failed === 0 ? '✅' : '❌';
    console.log(
      `${icon} #${result.hotpick_id} "${result.title}" — ${result.passed}/12 passed, ${result.warnings} warnings`
    );

    for (const issue of result.issues) {
      const prefix = issue.severity === 'error' ? '   ❌' : '   ⚠️';
      console.log(`${prefix} [${issue.rule}] ${issue.message}`);
    }
    console.log();
  }

  console.log('─'.repeat(60));
  console.log(
    `📊 Total: ${scenarios.length} scenarios, ${totalErrors} errors, ${totalWarnings} warnings`
  );

  if (totalErrors > 0) {
    process.exit(1);
  }
}

main();
