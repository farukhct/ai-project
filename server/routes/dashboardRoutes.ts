import { Router } from 'express';
import { getDb, queryScalar, queryRows } from '../db.js';
import { requireAuth } from '../auth.js';
import { toDisplayDate } from './caseRoutes.js';

const router = Router();

router.get('/dashboard', requireAuth, async (req, res) => {
  try {
    const db = await getDb();
    const todayIso = new Date().toISOString().split('T')[0];
    const currentMonth = todayIso.substring(0, 7); // YYYY-MM
    const currentYear = todayIso.substring(0, 4); // YYYY

    // 1. Total Cases
    const totalCases = (queryScalar(db, 'SELECT COUNT(*) FROM CourtDiary;') as number) || 0;

    // 2. Today's Cases (DairyDate == today)
    const todayCases = (queryScalar(
      db,
      'SELECT COUNT(*) FROM CourtDiary WHERE DairyDate = ?;',
      [todayIso]
    ) as number) || 0;

    // 3. Upcoming Cases (DairyDate > today)
    const upcomingCases = (queryScalar(
      db,
      'SELECT COUNT(*) FROM CourtDiary WHERE DairyDate > ?;',
      [todayIso]
    ) as number) || 0;

    // 4. Overdue Cases (DairyDate < today AND not disposed)
    const overdueCases = (queryScalar(
      db,
      `SELECT COUNT(*) FROM CourtDiary 
       WHERE DairyDate < ? 
       AND LOWER(Result) NOT IN ('disposed', 'allowed', 'dismissed', 'withdrawn');`,
      [todayIso]
    ) as number) || 0;

    // 5. Pending Cases
    const pendingCases = (queryScalar(
      db,
      `SELECT COUNT(*) FROM CourtDiary WHERE LOWER(Result) = 'pending';`
    ) as number) || 0;

    // 6. Completed / Disposed Cases
    const disposedCases = (queryScalar(
      db,
      `SELECT COUNT(*) FROM CourtDiary WHERE LOWER(Result) IN ('disposed', 'allowed', 'dismissed', 'withdrawn');`
    ) as number) || 0;

    // 7. Cases this month
    const monthCases = (queryScalar(
      db,
      `SELECT COUNT(*) FROM CourtDiary WHERE CaseDate LIKE ?;`,
      [`${currentMonth}%`]
    ) as number) || 0;

    // 8. Cases this year
    const yearCases = (queryScalar(
      db,
      `SELECT COUNT(*) FROM CourtDiary WHERE CaseDate LIKE ?;`,
      [`${currentYear}%`]
    ) as number) || 0;

    // 9. Cases by Result breakdown
    const casesByResult = queryRows<{ Result: string; count: number }>(
      db,
      `SELECT Result, COUNT(*) as count FROM CourtDiary GROUP BY Result ORDER BY count DESC;`
    );

    // 10. Today's Cases List
    const todayListRaw = queryRows<any>(
      db,
      `SELECT ID, SerialNo, CaseDate, CaseNumber, Result, DairyDate, Description, Remarks
       FROM CourtDiary
       WHERE DairyDate = ?
       ORDER BY SerialNo ASC
       LIMIT 50;`,
      [todayIso]
    );
    const todayList = todayListRaw.map(r => ({
      ...r,
      DisplayCaseDate: toDisplayDate(r.CaseDate),
      DisplayDairyDate: toDisplayDate(r.DairyDate),
      statusBadge: 'Today'
    }));

    // 11. Upcoming Cases List (ordered by DairyDate ASC)
    const upcomingListRaw = queryRows<any>(
      db,
      `SELECT ID, SerialNo, CaseDate, CaseNumber, Result, DairyDate, Description, Remarks
       FROM CourtDiary
       WHERE DairyDate > ?
       ORDER BY DairyDate ASC, SerialNo ASC
       LIMIT 25;`,
      [todayIso]
    );

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowIso = tomorrow.toISOString().split('T')[0];

    const upcomingList = upcomingListRaw.map(r => {
      let statusBadge = 'Upcoming';
      if (r.DairyDate === tomorrowIso) {
        statusBadge = 'Tomorrow';
      }
      return {
        ...r,
        DisplayCaseDate: toDisplayDate(r.CaseDate),
        DisplayDairyDate: toDisplayDate(r.DairyDate),
        statusBadge
      };
    });

    // 12. Overdue Cases List (ordered by DairyDate ASC - earliest overdue first)
    const overdueListRaw = queryRows<any>(
      db,
      `SELECT ID, SerialNo, CaseDate, CaseNumber, Result, DairyDate, Description, Remarks
       FROM CourtDiary
       WHERE DairyDate < ?
       AND LOWER(Result) NOT IN ('disposed', 'allowed', 'dismissed', 'withdrawn')
       ORDER BY DairyDate ASC, SerialNo ASC
       LIMIT 25;`,
      [todayIso]
    );
    const overdueList = overdueListRaw.map(r => ({
      ...r,
      DisplayCaseDate: toDisplayDate(r.CaseDate),
      DisplayDairyDate: toDisplayDate(r.DairyDate),
      statusBadge: 'Overdue'
    }));

    // Recent Proceedings / Real-time Bench Notes
    const recentProceedingsRaw = queryRows<any>(
      db,
      `SELECT cp.ID, cp.CaseID, cp.HearingDate, cp.BusinessRecorded, cp.NextHearingDate, cp.BenchNotes, cp.CreatedBy, cd.CaseNumber, cd.SerialNo
       FROM CaseProceedings cp
       JOIN CourtDiary cd ON cp.CaseID = cd.ID
       ORDER BY cp.ID DESC
       LIMIT 5;`
    );
    const recentProceedings = recentProceedingsRaw.map(p => ({
      ...p,
      DisplayHearingDate: toDisplayDate(p.HearingDate),
      DisplayNextHearingDate: p.NextHearingDate ? toDisplayDate(p.NextHearingDate) : ''
    }));

    res.json({
      statistics: {
        totalCases,
        todayCases,
        upcomingCases,
        overdueCases,
        pendingCases,
        disposedCases,
        monthCases,
        yearCases
      },
      casesByResult,
      todayList,
      upcomingList,
      overdueList,
      recentProceedings,
      currentDateIso: todayIso,
      currentDateDisplay: toDisplayDate(todayIso)
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error loading dashboard statistics' });
  }
});

export default router;
