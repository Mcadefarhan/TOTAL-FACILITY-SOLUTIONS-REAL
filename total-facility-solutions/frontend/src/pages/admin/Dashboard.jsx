import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../utils/api';
import { StatCard, PageHeader, StatusBadge, Skeleton } from '../../components/UI';
import { Avatar } from '../../components/UI';
import { Users, Building2, BriefcaseBusiness, CheckCircle, Clock, TrendingUp, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import toast from 'react-hot-toast';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const SKILL_COLORS = ['#C8922A','#1A3A6B','#16a34a','#3b82f6','#8b5cf6','#ef4444','#f59e0b','#06b6d4'];

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getOverview()
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load overview'))
      .finally(() => setLoading(false));
  }, []);

  // Process monthly chart data
  const chartData = (() => {
    if (!data?.analytics?.monthlyData) return [];
    const map = {};
    data.analytics.monthlyData.forEach(({ _id, count }) => {
      const key = `${MONTHS[_id.month - 1]} ${_id.year}`;
      if (!map[key]) map[key] = { month: key, seekers: 0, employers: 0 };
      map[key][_id.role === 'seeker' ? 'seekers' : 'employers'] = count;
    });
    return Object.values(map).slice(-6);
  })();

  const skillsData = data?.analytics?.skillsData || [];

  if (loading) return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
      <div className="grid lg:grid-cols-2 gap-6">{[1,2].map(i => <Skeleton key={i} className="h-64 rounded-xl" />)}</div>
    </div>
  );

  const { stats } = data || {};

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Admin Overview" subtitle="Platform performance and activity at a glance" />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        <StatCard label="Total Seekers" value={stats?.seekers?.total ?? 0} icon={Users} iconBg="bg-blue-100" iconColor="text-blue-600"
          sub={`${stats?.seekers?.active ?? 0} active applications`} />
        <StatCard label="Seekers Placed" value={stats?.seekers?.placed ?? 0} icon={CheckCircle} iconBg="bg-green-100" iconColor="text-green-600"
          sub="Successfully placed" />
        <StatCard label="Employers" value={stats?.employers?.total ?? 0} icon={Building2} iconBg="bg-amber-100" iconColor="text-amber-600"
          sub={`${stats?.employers?.verified ?? 0} verified`} />
        <StatCard label="Staff Requests" value={stats?.requests?.total ?? 0} icon={BriefcaseBusiness} iconBg="bg-purple-100" iconColor="text-purple-600"
          sub={`${stats?.requests?.pending ?? 0} pending review`} />
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Registrations Chart */}
        <div className="lg:col-span-2 card p-6">
          <div className="section-header">
            <h2 className="section-title">Registrations (Last 6 Months)</h2>
            <TrendingUp className="w-4 h-4 text-gray-400" />
          </div>
          {chartData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #f0f0f0', fontSize: 12 }} />
                <Bar dataKey="seekers" fill="#1A3A6B" radius={[4, 4, 0, 0]} name="Job Seekers" />
                <Bar dataKey="employers" fill="#C8922A" radius={[4, 4, 0, 0]} name="Employers" />
              </BarChart>
            </ResponsiveContainer>
          )}
          <div className="flex gap-4 mt-3">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-navy-700" /><span className="text-xs text-gray-500">Job Seekers</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-gold-500" /><span className="text-xs text-gray-500">Employers</span></div>
          </div>
        </div>

        {/* Skills Distribution */}
        <div className="card p-6">
          <div className="section-header">
            <h2 className="section-title">Top Skills</h2>
          </div>
          {skillsData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No data yet</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={skillsData} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={65} innerRadius={35}>
                    {skillsData.map((_, i) => <Cell key={i} fill={SKILL_COLORS[i % SKILL_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {skillsData.slice(0, 5).map(({ _id, count }, i) => (
                  <div key={_id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: SKILL_COLORS[i % SKILL_COLORS.length] }} />
                      <span className="text-xs text-gray-600 truncate max-w-[100px]">{_id}</span>
                    </div>
                    <span className="text-xs font-bold text-navy-800">{count}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Seekers */}
        <div className="card p-6">
          <div className="section-header">
            <h2 className="section-title">Recent Seekers</h2>
            <Link to="/admin/seekers" className="text-sm text-gold-600 hover:text-gold-500 font-medium">View all →</Link>
          </div>
          <div className="space-y-3">
            {(data?.recentSeekers || []).map(s => (
              <div key={s._id} className="flex items-center gap-3 py-2">
                <Avatar src={s.avatar} name={s.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-navy-800 truncate">{s.name}</p>
                  <p className="text-xs text-gray-400">{s.seekerProfile?.primarySkill || 'Skill not set'}</p>
                </div>
                <StatusBadge status={s.seekerProfile?.applicationStatus || 'draft'} />
              </div>
            ))}
            {(data?.recentSeekers || []).length === 0 && <p className="text-sm text-gray-400 text-center py-6">No seekers yet</p>}
          </div>
        </div>

        {/* Recent Requests */}
        <div className="card p-6">
          <div className="section-header">
            <h2 className="section-title">Recent Requests</h2>
            <Link to="/admin/requests" className="text-sm text-gold-600 hover:text-gold-500 font-medium">View all →</Link>
          </div>
          <div className="space-y-3">
            {(data?.recentRequests || []).map(r => (
              <div key={r._id} className="flex items-center gap-3 py-2">
                <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center text-amber-700 font-bold text-sm flex-shrink-0">
                  {r.staffType?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-navy-800 truncate">{r.title}</p>
                  <p className="text-xs text-gray-400">{r.employer?.employerProfile?.businessName || r.employer?.name} · {r.numberOfStaff} staff</p>
                </div>
                <StatusBadge status={r.status} />
              </div>
            ))}
            {(data?.recentRequests || []).length === 0 && <p className="text-sm text-gray-400 text-center py-6">No requests yet</p>}
          </div>
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { to: '/admin/seekers', icon: Users, label: 'Review Applications', sub: `${stats?.seekers?.active ?? 0} need attention`, color: 'bg-blue-500' },
          { to: '/admin/requests', icon: BriefcaseBusiness, label: 'Process Requests', sub: `${stats?.requests?.pending ?? 0} pending`, color: 'bg-gold-500' },
          { to: '/admin/employers', icon: Building2, label: 'Verify Employers', sub: `${(stats?.employers?.total ?? 0) - (stats?.employers?.verified ?? 0)} unverified`, color: 'bg-purple-500' },
        ].map(({ to, icon: Icon, label, sub, color }) => (
          <Link key={to} to={to} className="card p-5 flex items-center gap-4 hover:shadow-card-hover transition-all group">
            <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center flex-shrink-0`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-navy-800 text-sm">{label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gold-500 transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
}
