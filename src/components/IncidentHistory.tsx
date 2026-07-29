import React from 'react';
import { Incident } from '../types';
import { AlertOctagon, CheckCircle2, Clock, Calendar, ShieldAlert } from 'lucide-react';

interface IncidentHistoryProps {
  incidents: Incident[];
}

export const IncidentHistory: React.FC<IncidentHistoryProps> = ({ incidents }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-[#0F1115] border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-amber-500 dark:text-amber-400" />
            <span>Incidents & Downtime Records</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Historical log of service outages, HTTP status errors, and recovery duration.
          </p>
        </div>
        <div className="text-xs font-mono text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
          Total Incidents: {incidents.length}
        </div>
      </div>

      {/* Incident List */}
      {incidents.length === 0 ? (
        <div className="bg-white dark:bg-[#0F1115] border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center shadow-sm">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 dark:text-emerald-400 mx-auto mb-3 opacity-90" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Active or Past Incidents</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            All monitored endpoints have maintained 100% operational availability with expected HTTP 200 responses.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {incidents.map((incident) => {
            const isResolved = incident.status === 'resolved';

            return (
              <div
                key={incident.id}
                className={`border rounded-xl p-5 transition-all shadow-sm ${
                  isResolved
                    ? 'bg-white dark:bg-[#0F1115] border-slate-200 dark:border-slate-800'
                    : 'bg-rose-50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-500/40'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                      isResolved
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                    }`}>
                      {isResolved ? <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> : <AlertOctagon className="w-5 h-5" />}
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-base font-bold text-slate-900 dark:text-white">{incident.siteName}</h4>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                          isResolved
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                        }`}>
                          {isResolved ? 'RESOLVED' : 'ACTIVE OUTAGE'}
                        </span>
                      </div>

                      <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">{incident.url}</p>
                      
                      {incident.error && (
                        <p className="text-xs font-mono text-rose-700 dark:text-rose-300 bg-rose-50/50 dark:bg-slate-950 px-2.5 py-1.5 rounded border border-rose-200 dark:border-slate-800 mt-2">
                          Cause: {incident.error}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right text-xs font-mono text-slate-500 dark:text-slate-400 space-y-1 shrink-0">
                    <div className="flex items-center justify-end space-x-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      <span>{new Date(incident.startTime).toLocaleString()}</span>
                    </div>

                    {incident.durationMs && (
                      <div className="flex items-center justify-end space-x-1.5 text-slate-700 dark:text-slate-300">
                        <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                        <span>Duration: {Math.round(incident.durationMs / 60000)} mins</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
