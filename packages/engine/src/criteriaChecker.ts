/* eslint-disable @typescript-eslint/no-explicit-any */
export class CriteriaChecker {
  async verifyCriteria(
    agentAddress: string,
    taskId: string,
    criteria: any[],
    outputContent: string,
  ): Promise<boolean> {
    let passedCount = 0;
    let totalWeight = 0;

    for (const criterion of criteria) {
      totalWeight += criterion.weight || 1;

      const passed = this.evaluateCriterion(criterion, outputContent);
      if (passed) {
        passedCount += criterion.weight || 1;
      }
    }

    // Default to a 70% threshold for passing
    return passedCount / totalWeight >= 0.7;
  }

  private evaluateCriterion(criterion: any, outputContent: string): boolean {
    const valStr = criterion.expectedValue ? criterion.expectedValue.toString().toLowerCase() : '';

    // Field Extraction
    let actualValue: any = 0;
    if (criterion.fieldName === 'wordCount') {
      actualValue = outputContent.split(/\s+/).filter((w) => w.length > 0).length;
    } else if (criterion.fieldName === 'sourceCount') {
      // Deep regex for URL detection (0G spec requirement for source integrity)
      const urlRegex = /https?:\/\/[^\s/$.?#].[^\s]*/g;
      const matches = outputContent.match(urlRegex);
      actualValue = matches ? matches.length : 0;
    } else {
      actualValue = outputContent;
    }

    switch (criterion.operator) {
      case 'gte':
        return (
          typeof actualValue === 'number' && actualValue >= parseInt(criterion.expectedValue, 10)
        );
      case 'lte':
        return (
          typeof actualValue === 'number' && actualValue <= parseInt(criterion.expectedValue, 10)
        );
      case 'eq':
        return actualValue.toString() === criterion.expectedValue.toString();
      case 'contains':
        return outputContent.toLowerCase().includes(valStr);
      case 'truthy':
        return !!outputContent && outputContent.trim().length > 0;
      case 'json':
        try {
          JSON.parse(outputContent);
          return true;
        } catch {
          // Check if it's wrapped in markdown
          const jsonMatch = outputContent.match(/```json\n([\s\S]*)\n```/);
          if (jsonMatch) {
            try {
              JSON.parse(jsonMatch[1]);
              return true;
            } catch {
              return false;
            }
          }
          return false;
        }
      case 'density': {
        const words = outputContent.toLowerCase().split(/\s+/);
        const count = words.filter((w) => w.includes(valStr)).length;
        const density = (count / words.length) * 100; // Result in percentage
        return density >= parseInt(criterion.expectedValue, 10);
      }
      default:
        return false;
    }
  }
}
