import React, { useEffect, useState } from 'react';
import { AnalyticsData, LinkItem } from '../types.js';
import { api } from '../lib/api.js';
import { 
  BarChart3, MapPin, Smartphone, Monitor, Tablet, Bot, Globe, 
  Share2, Compass, Clock, Users, ArrowUpRight, Filter, RefreshCw, 
  Sparkles, ShieldCheck, PieChart, Layers
} from 'lucide-react';

interface ClickAnalyticsCardProps {
  isAdmin?: boolean;
  links?: LinkItem[];
}

export const ClickAnalyticsCard: React.FC<ClickAnalyticsCardProps> = ({ isAdmin = false, links = [] }) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedLink, setSelectedLink] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'region' | 'links' | 'channel' | 'device' | 'browser' | 'logs'>('region');

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = isAdmin
        ? await api.getAdminAnalytics(selectedLink, selectedPeriod)
        : await api.getUserAnalytics(selectedLink, selectedPeriod);
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Không thể tải dữ liệu phân tích');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [selectedLink, selectedPeriod, isAdmin]);

  const getDeviceIcon = (name: string) => {
    if (name.includes('Mobile') || name.includes('Smartphone')) return <Smartphone className="w-4 h-4 text-blue-500" />;
    if (name.includes('Desktop') || name.includes('Máy tính')) return <Monitor className="w-4 h-4 text-emerald-500" />;
    if (name.includes('Tablet')) return <Tablet className="w-4 h-4 text-purple-500" />;
    return <Bot className="w-4 h-4 text-amber-500" />;
  };

  const getChannelColor = (name: string) => {
    if (name.includes('Facebook')) return 'bg-blue-600 text-white';
    if (name.includes('Zalo')) return 'bg-blue-500 text-white';
    if (name.includes('Google')) return 'bg-red-500 text-white';
    if (name.includes('TikTok')) return 'bg-slate-900 text-white';
    if (name.includes('Telegram')) return 'bg-sky-500 text-white';
    if (name.includes('Instagram')) return 'bg-pink-600 text-white';
    return 'bg-slate-600 text-white';
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden mb-6">
      {/* Header & Filter Controls */}
      <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Phân Tích Tỷ Lệ Click Vùng & Đối Tượng
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full font-bold">
                  Realtime
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Thống kê chi tiết lưu lượng truy cập theo Vùng miền, Kênh nguồn, Thiết bị và Trình duyệt
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Link Filter */}
          {links.length > 0 && (
            <div className="relative">
              <select
                value={selectedLink}
                onChange={(e) => setSelectedLink(e.target.value)}
                className="pl-3 pr-8 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="all">Tất cả Link ({links.length})</option>
                {links.map((link) => (
                  <option key={link.id} value={link.id}>
                    /{link.slug} - {link.title ? link.title.substring(0, 24) : 'Khôn tên'}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Period Filter */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'today', label: 'Hôm nay' },
              { id: '7d', label: '7 ngày' },
              { id: '30d', label: '30 ngày' }
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPeriod(p.id)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  selectedPeriod === p.id
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition min-h-[36px] min-w-[36px] flex items-center justify-center"
            title="Tải lại dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-500" />
          <p className="text-xs font-medium">Đang tổng hợp dữ liệu phân tích...</p>
        </div>
      ) : error ? (
        <div className="p-6 text-center text-rose-500 text-xs">
          {error}
        </div>
      ) : data ? (
        <div className="p-5 space-y-6">
          {/* Overview Key Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3.5 bg-slate-50/80 border border-slate-100 rounded-xl">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Tổng Lượt Click
              </div>
              <div className="text-xl font-bold text-slate-900">{data.total_clicks}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Lưu lượng truy cập ghi nhận</div>
            </div>

            <div className="p-3.5 bg-emerald-50/50 border border-emerald-100 rounded-xl">
              <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                Người Dùng Thực
              </div>
              <div className="text-xl font-bold text-emerald-900 flex items-baseline gap-1.5">
                {data.human_clicks}
                <span className="text-xs font-bold text-emerald-600">({data.human_percent}%)</span>
              </div>
              <div className="w-full bg-emerald-100 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${data.human_percent}%` }}
                />
              </div>
            </div>

            <div className="p-3.5 bg-amber-50/50 border border-amber-100 rounded-xl">
              <div className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Bot className="w-3.5 h-3.5" />
                Bot Crawler Preview
              </div>
              <div className="text-xl font-bold text-amber-900 flex items-baseline gap-1.5">
                {data.bot_clicks}
                <span className="text-xs font-bold text-amber-600">({data.bot_percent}%)</span>
              </div>
              <div className="w-full bg-amber-100 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${data.bot_percent}%` }}
                />
              </div>
            </div>

            <div className="p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-xl">
              <div className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                Top Vùng Miền
              </div>
              <div className="text-sm font-bold text-indigo-900 truncate">
                {data.regions.length > 0 ? data.regions[0].name : 'Chưa có'}
              </div>
              <div className="text-[10px] text-indigo-600 mt-0.5">
                {data.regions.length > 0 ? `${data.regions[0].count} clicks (${data.regions[0].percentage}%)` : '0%'}
              </div>
            </div>
          </div>

          {/* Navigation Tabs for Analysis View */}
          <div className="border-b border-slate-100 pb-2 flex items-center justify-between overflow-x-auto">
            <div className="flex gap-2 min-w-max">
              {[
                { id: 'region', label: 'Tỷ Lệ Vùng Miền', icon: MapPin },
                { id: 'links', label: 'Xếp Hạng Từng Link', icon: Layers },
                { id: 'channel', label: 'Kênh Nguồn Traffic', icon: Share2 },
                { id: 'device', label: 'Phân Loại Thiết Bị', icon: Smartphone },
                { id: 'browser', label: 'Trình Duyệt & App', icon: Globe },
                { id: 'logs', label: 'Nhật Ký Click Mới Nhất', icon: Clock }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab 1: Region Analysis */}
          {activeTab === 'region' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Danh sách tỉnh thành / quốc gia phát sinh lượt click:</span>
                <span>Tỷ lệ phần trăm (%)</span>
              </div>

              {data.regions.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Chưa ghi nhận lượt click nào theo vùng miền trong khoảng thời gian này.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {data.regions.map((reg, idx) => (
                    <div
                      key={reg.name}
                      className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl hover:border-slate-200 transition"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold flex items-center justify-center border border-indigo-100 shrink-0">
                            #{idx + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            {reg.name}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-slate-900">
                          {reg.count} <span className="text-slate-400 font-normal">clicks</span> ({reg.percentage}%)
                        </div>
                      </div>

                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.max(reg.percentage, 3)}%`,
                            backgroundColor: reg.color || '#6366f1'
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Channel Sources Analysis */}
          {activeTab === 'channel' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Nguồn giới thiệu (Referrer Channels):</span>
                <span>Phần trăm lưu lượng</span>
              </div>

              {data.referrers.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Chưa ghi nhận nguồn traffic nào.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {data.referrers.map((ref, idx) => (
                    <div
                      key={ref.name}
                      className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl hover:border-slate-200 transition"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${getChannelColor(ref.name)}`}>
                            {ref.name}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-slate-900">
                          {ref.count} clicks ({ref.percentage}%)
                        </div>
                      </div>

                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.max(ref.percentage, 3)}%`,
                            backgroundColor: ref.color || '#3b82f6'
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Device Type Analysis */}
          {activeTab === 'device' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {data.devices.map((dev) => (
                  <div
                    key={dev.name}
                    className="p-4 bg-slate-50/70 border border-slate-100 rounded-xl flex items-center gap-3"
                  >
                    <div className="p-2.5 bg-white border border-slate-200 rounded-xl shadow-2xs shrink-0">
                      {getDeviceIcon(dev.name)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-800">{dev.name}</span>
                        <span className="text-xs font-bold text-slate-900">
                          {dev.count} ({dev.percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.max(dev.percentage, 3)}%`,
                            backgroundColor: dev.color || '#10b981'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 4: Browser Analysis */}
          {activeTab === 'browser' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {data.browsers.map((b) => (
                  <div
                    key={b.name}
                    className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-slate-500 shrink-0" />
                      <span className="text-xs font-semibold text-slate-800">{b.name}</span>
                    </div>
                    <div className="text-xs font-bold text-slate-900">
                      {b.count} clicks ({b.percentage}%)
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 5: Links Breakdown & Ranking */}
          {activeTab === 'links' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Thống kê hiệu suất click từng link trong khoảng thời gian đã chọn:</span>
                <span>Sắp xếp theo Lượt Click</span>
              </div>

              {!data.links_breakdown || data.links_breakdown.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Chưa ghi nhận dữ liệu click theo link nào.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="px-3.5 py-2.5">Link / Slug</th>
                          <th className="px-3.5 py-2.5">Tổng Click</th>
                          <th className="px-3.5 py-2.5">Người dùng (%)</th>
                          <th className="px-3.5 py-2.5">Bot Preview</th>
                          <th className="px-3.5 py-2.5">Vị trí Top 1</th>
                          <th className="px-3.5 py-2.5">Thiết bị Top 1</th>
                          <th className="px-3.5 py-2.5">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-sans text-xs">
                        {data.links_breakdown.map((l) => (
                          <tr key={l.link_id} className="hover:bg-slate-50 transition">
                            <td className="px-3.5 py-2.5 font-medium text-slate-900 max-w-[200px]">
                              <div className="font-mono text-indigo-600 font-bold">/{l.slug}</div>
                              <div className="text-[11px] text-slate-500 truncate">{l.title || l.slug}</div>
                            </td>
                            <td className="px-3.5 py-2.5 font-bold text-slate-900">
                              {l.total_clicks}
                            </td>
                            <td className="px-3.5 py-2.5 text-emerald-700 font-semibold">
                              {l.human_clicks} ({l.total_clicks > 0 ? Math.round((l.human_clicks / l.total_clicks) * 100) : 0}%)
                            </td>
                            <td className="px-3.5 py-2.5 text-amber-700 font-semibold">
                              {l.bot_clicks}
                            </td>
                            <td className="px-3.5 py-2.5 text-slate-600">
                              {l.top_region || 'Chưa có'}
                            </td>
                            <td className="px-3.5 py-2.5 text-slate-600">
                              {l.top_device || 'Chưa có'}
                            </td>
                            <td className="px-3.5 py-2.5">
                              <button
                                onClick={() => setSelectedLink(l.link_id)}
                                className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold rounded-lg transition"
                              >
                                Lọc link này
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 6: Recent Visit Logs Table */}
          {activeTab === 'logs' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Nhật ký 30 lượt truy cập mới nhất:</span>
                <span>Thời gian thực</span>
              </div>

              {!data.recent_visits || data.recent_visits.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Chưa ghi nhận lượt click nào.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="px-3 py-2.5">Thời gian</th>
                          <th className="px-3 py-2.5">Link Slug</th>
                          <th className="px-3 py-2.5">Đối tượng</th>
                          <th className="px-3 py-2.5">Vị trí</th>
                          <th className="px-3 py-2.5">Thiết bị / App</th>
                          <th className="px-3 py-2.5">Nguồn Referrer</th>
                          <th className="px-3 py-2.5">IP</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                        {data.recent_visits.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50/80 transition">
                            <td className="px-3 py-2 text-slate-500 whitespace-nowrap">
                              {new Date(log.created_at).toLocaleString('vi-VN')}
                            </td>
                            <td className="px-3 py-2 text-indigo-600 font-bold whitespace-nowrap">
                              /{log.slug}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              {log.is_bot ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold font-sans">
                                  <Bot className="w-3 h-3" /> Bot
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold font-sans font-sans">
                                  Người dùng
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2 font-sans font-semibold text-slate-800 whitespace-nowrap">
                              {log.country || 'TP. Hồ Chí Minh'}
                            </td>
                            <td className="px-3 py-2 font-sans text-slate-700 whitespace-nowrap">
                              {log.device} ({log.browser})
                            </td>
                            <td className="px-3 py-2 font-sans text-slate-600 whitespace-nowrap max-w-[140px] truncate">
                              {log.referer || 'Direct'}
                            </td>
                            <td className="px-3 py-2 text-slate-400 whitespace-nowrap">
                              {log.ip}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Hourly Trend Visual Graph */}
          {data.hourly_trend && data.hourly_trend.length > 0 && (
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                    Phân Bố Click Theo Khung Giờ 24H
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px]">
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    <span className="text-slate-600 font-medium">Người dùng thực</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span className="text-slate-600 font-medium">Bot Preview</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                <div className="flex items-end justify-between gap-1 h-28 pt-4 pb-1">
                  {data.hourly_trend.map((item) => {
                    const totalBar = item.human + item.bot;
                    const maxTotal = Math.max(...data.hourly_trend.map(t => t.human + t.bot), 1);
                    const heightPercent = Math.round((totalBar / maxTotal) * 100);
                    
                    return (
                      <div key={item.hour} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group relative">
                        {/* Tooltip on hover */}
                        <div className="opacity-0 group-hover:opacity-100 pointer-events-none absolute -top-8 bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded shadow-md z-10 whitespace-nowrap transition-opacity">
                          {item.hour}: {item.human} human, {item.bot} bot
                        </div>

                        <div className="w-full max-w-[20px] bg-slate-200 rounded-t overflow-hidden flex flex-col justify-end" style={{ height: `${Math.max(heightPercent, 5)}%` }}>
                          {item.bot > 0 && (
                            <div className="bg-amber-400 w-full transition-all" style={{ height: `${(item.bot / Math.max(totalBar, 1)) * 100}%` }} />
                          )}
                          {item.human > 0 && (
                            <div className="bg-indigo-500 w-full transition-all" style={{ height: `${(item.human / Math.max(totalBar, 1)) * 100}%` }} />
                          )}
                        </div>
                        <span className="text-[9px] text-slate-400 font-mono">{item.hour}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};
