import { Summary } from '../types/summary';

// 簡易的なインメモリデータベース（実際の実装ではPostgreSQLなどを使用）
const summaries: Map<string, Summary> = new Map();

export class SummaryRepository {
  async save(summary: Summary): Promise<Summary> {
    summaries.set(summary.summaryId, summary);
    return summary;
  }

  async findById(summaryId: string): Promise<Summary | null> {
    const summary = summaries.get(summaryId);
    return summary || null;
  }

  async update(summaryId: string, updates: Partial<Summary>): Promise<Summary> {
    const existing = summaries.get(summaryId);
    if (!existing) {
      throw new Error(`Summary with id ${summaryId} not found`);
    }

    const updated: Summary = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    summaries.set(summaryId, updated);
    return updated;
  }

  async findByPatientId(patientId: string): Promise<Summary[]> {
    return Array.from(summaries.values()).filter(
      (summary) => summary.patientId === patientId
    );
  }
}
