import React, { useEffect, useState, useMemo } from 'react';

type ProjectSummary = {
  projectName: string;
  totalScans: number;
  totalVulns: number;
  severityCount: Record<string, number>;
  images: ImageSummary[];
  lastScan: string;
};

type ImageSummary = {
  imageName: string;
  filename: string;
  totalVulns: number;
  severityCount: Record<string, number>;
  modifiedAt: string;
};

type Vulnerability = {
  VulnerabilityID: string;
  PkgName: string;
  InstalledVersion: string;
  FixedVersion: string;
  Severity: string;
  Title: string;
  Description: string;
  PrimaryURL?: string;
};

const API_BASE =
  import.meta.env.VITE_API_BASE || (import.meta.env.DEV ? 'http://localhost:8180' : '');

type Page = 'dashboard' | 'projects' | 'project-detail';

function App() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [projectDetails, setProjectDetails] = useState<ProjectSummary | null>(null);
  const [selectedFilename, setSelectedFilename] = useState<string | null>(null);
  const [vulnDetails, setVulnDetails] = useState<Vulnerability[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string | null>(null);

  useEffect(() => {
    if (!API_BASE) return;
    setLoading(true);
    fetch(`${API_BASE}/api/projects`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`API error: ${res.status}`);
        }
        return res.json();
      })
      .then((data: ProjectSummary[]) => {
        setProjects(data);
        setError(null);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedProject || !API_BASE) return;
    setLoadingDetails(true);
    fetch(`${API_BASE}/api/projects/${selectedProject}`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`API error: ${res.status}`);
        }
        return res.json();
      })
      .then((data: ProjectSummary) => {
        setProjectDetails(data);
      })
      .catch((err) => {
        console.error('Failed to load project details:', err);
        setProjectDetails(null);
      })
      .finally(() => setLoadingDetails(false));
  }, [selectedProject]);

  useEffect(() => {
    if (!selectedFilename || !API_BASE) return;
    setLoadingDetails(true);
    fetch(`${API_BASE}/api/scans/${selectedFilename}`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`API error: ${res.status}`);
        }
        return res.json();
      })
      .then((data: { vulnerabilities: Vulnerability[] }) => {
        setVulnDetails(data.vulnerabilities || []);
      })
      .catch((err) => {
        console.error('Failed to load details:', err);
        setVulnDetails([]);
      })
      .finally(() => setLoadingDetails(false));
  }, [selectedFilename]);

  // Calculate overall statistics
  const overallStats = useMemo(() => {
    const totalProjects = projects.length;
    const totalScans = projects.reduce((sum, p) => sum + p.totalScans, 0);
    const totalVulns = projects.reduce((sum, p) => sum + p.totalVulns, 0);
    const severityCount: Record<string, number> = {};
    projects.forEach((p) => {
      Object.keys(p.severityCount).forEach((severity) => {
        severityCount[severity] = (severityCount[severity] || 0) + p.severityCount[severity];
      });
    });
    return { totalProjects, totalScans, totalVulns, severityCount };
  }, [projects]);

  // Filter projects based on search query
  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    const query = searchQuery.toLowerCase();
    return projects.filter((p) => p.projectName.toLowerCase().includes(query));
  }, [projects, searchQuery]);

  // Filter projects by selected severity (for dashboard)
  const projectsBySeverity = useMemo(() => {
    if (!selectedSeverity) return [];
    return projects.filter((p) => (p.severityCount[selectedSeverity] || 0) > 0);
  }, [projects, selectedSeverity]);

  if (currentPage === 'project-detail' && projectDetails) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setCurrentPage('projects');
                  setSelectedProject(null);
                  setProjectDetails(null);
                  setSelectedFilename(null);
                  setVulnDetails([]);
                }}
                className="text-slate-400 hover:text-slate-100 mr-2"
              >
                ← Geri
              </button>
              <span className="rounded bg-emerald-500/10 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-400">
                {projectDetails.projectName}
              </span>
              <span className="text-lg font-semibold">Proje Detayları</span>
            </div>
            <span className="text-xs text-slate-400">Prototype UI</span>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-4 py-6 space-y-6">
          <section className="grid gap-4 md:grid-cols-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Toplam Tarama
              </p>
              <p className="mt-2 text-3xl font-semibold">{projectDetails.totalScans}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Toplam Açık
              </p>
              <p className="mt-2 text-3xl font-semibold">{projectDetails.totalVulns}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                CRITICAL
              </p>
              <p className="mt-2 text-3xl font-semibold text-rose-400">
                {projectDetails.severityCount['CRITICAL'] || 0}
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">HIGH</p>
              <p className="mt-2 text-3xl font-semibold text-orange-400">
                {projectDetails.severityCount['HIGH'] || 0}
              </p>
            </div>
          </section>

          <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <h2 className="text-sm font-semibold text-slate-100 mb-4">İmajlar ve Taramalar</h2>

            {projectDetails.images.length === 0 ? (
              <div className="text-center py-8 text-slate-400">Henüz tarama bulunamadı.</div>
            ) : (
              <div className="space-y-4">
                {projectDetails.images.map((image) => (
                  <div
                    key={image.filename}
                    className="border border-slate-800 rounded-lg p-4 bg-slate-950/60"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-100">{image.imageName}</h3>
                        <p className="text-xs text-slate-400 mt-1">
                          {new Date(image.modifiedAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <div className="text-right">
                          <span className="text-slate-400">Toplam: </span>
                          <span className="font-semibold text-slate-100">{image.totalVulns}</span>
                        </div>
                        <div className="flex gap-2">
                          {image.severityCount['CRITICAL'] > 0 && (
                            <span className="text-rose-400 font-semibold">
                              C:{image.severityCount['CRITICAL']}
                            </span>
                          )}
                          {image.severityCount['HIGH'] > 0 && (
                            <span className="text-orange-400 font-semibold">
                              H:{image.severityCount['HIGH']}
                            </span>
                          )}
                          {image.severityCount['MEDIUM'] > 0 && (
                            <span className="text-yellow-400 font-semibold">
                              M:{image.severityCount['MEDIUM']}
                            </span>
                          )}
                          {image.severityCount['LOW'] > 0 && (
                            <span className="text-blue-400 font-semibold">
                              L:{image.severityCount['LOW']}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedFilename(image.filename)}
                      className="text-xs px-3 py-1 rounded border border-slate-700 hover:bg-slate-800 text-slate-300"
                    >
                      Açıkları Görüntüle →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {selectedFilename && (
            <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-100">
                  Açıklar: {selectedFilename}
                </h2>
                <button
                  onClick={() => setSelectedFilename(null)}
                  className="px-3 py-1 text-xs rounded border border-slate-700 hover:bg-slate-800 text-slate-300"
                >
                  Kapat
                </button>
              </div>

              {loadingDetails ? (
                <div className="text-center py-8 text-slate-400">Yükleniyor...</div>
              ) : vulnDetails.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  Bu raporda açık bulunamadı.
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {vulnDetails.map((vuln, idx) => {
                    const severityColor =
                      vuln.Severity === 'CRITICAL'
                        ? 'text-rose-400'
                        : vuln.Severity === 'HIGH'
                          ? 'text-orange-400'
                          : vuln.Severity === 'MEDIUM'
                            ? 'text-yellow-400'
                            : vuln.Severity === 'LOW'
                              ? 'text-blue-400'
                              : 'text-slate-400';
                    return (
                      <div
                        key={`${vuln.VulnerabilityID}-${idx}`}
                        className="border border-slate-800 rounded-lg p-4 bg-slate-950/60"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <span className="font-mono text-xs text-emerald-300">
                              {vuln.VulnerabilityID}
                            </span>
                            <span className={`ml-2 text-xs font-semibold ${severityColor}`}>
                              {vuln.Severity}
                            </span>
                          </div>
                          {vuln.PrimaryURL && (
                            <a
                              href={vuln.PrimaryURL}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-400 hover:underline"
                            >
                              Detay →
                            </a>
                          )}
                        </div>
                        <h3 className="text-sm font-semibold text-slate-100 mb-1">
                          {vuln.Title || vuln.VulnerabilityID}
                        </h3>
                        <div className="text-xs text-slate-400 mb-2">
                          <span className="font-mono">{vuln.PkgName}</span>
                          {vuln.InstalledVersion && (
                            <span className="ml-2">
                              v{vuln.InstalledVersion}
                              {vuln.FixedVersion && (
                                <span className="text-emerald-400 ml-1">
                                  → v{vuln.FixedVersion}
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                        {vuln.Description && (
                          <p className="text-xs text-slate-300 mt-2 line-clamp-3">
                            {vuln.Description}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}
        </main>
      </div>
    );
  }

  if (currentPage === 'projects') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage('dashboard')}
                className="text-slate-400 hover:text-slate-100 mr-2"
              >
                ← Ana Sayfa
              </button>
              <span className="rounded bg-emerald-500/10 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-400">
                Trivy
              </span>
              <span className="text-lg font-semibold">Projeler</span>
            </div>
            <span className="text-xs text-slate-400">Prototype UI</span>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-4 py-6 space-y-6">
          <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-100">Projeler</h2>
              <span className="text-xs text-slate-500">
                {filteredProjects.length} / {projects.length} proje
              </span>
            </div>

            <div className="mb-4">
              <input
                type="text"
                placeholder="Proje ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-700 bg-slate-950 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            {filteredProjects.length === 0 && !loading && !error && (
              <div className="flex h-40 items-center justify-center text-sm text-slate-500">
                {searchQuery
                  ? 'Arama kriterlerine uygun proje bulunamadı.'
                  : 'Henüz proje bulunamadı. export klasörüne JSON dosyası koyduktan sonra sayfayı yenile.'}
              </div>
            )}

            {filteredProjects.length > 0 && (
              <div className="space-y-3">
                {filteredProjects.map((project) => (
                  <div
                    key={project.projectName}
                    className="border border-slate-800 rounded-lg p-4 bg-slate-950/60 hover:bg-slate-900/40 cursor-pointer transition-colors"
                    onClick={() => {
                      setSelectedProject(project.projectName);
                      setCurrentPage('project-detail');
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-100">
                          {project.projectName}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">
                          {project.totalScans} tarama • Son tarama:{' '}
                          {new Date(project.lastScan).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="text-xs text-slate-400">Toplam Açık</span>
                          <p className="text-2xl font-semibold text-slate-100">
                            {project.totalVulns}
                          </p>
                        </div>
                        <div className="flex gap-3 text-sm">
                          {project.severityCount['CRITICAL'] > 0 && (
                            <div className="text-center">
                              <p className="text-xs text-slate-400">CRITICAL</p>
                              <p className="text-lg font-semibold text-rose-400">
                                {project.severityCount['CRITICAL']}
                              </p>
                            </div>
                          )}
                          {project.severityCount['HIGH'] > 0 && (
                            <div className="text-center">
                              <p className="text-xs text-slate-400">HIGH</p>
                              <p className="text-lg font-semibold text-orange-400">
                                {project.severityCount['HIGH']}
                              </p>
                            </div>
                          )}
                          {project.severityCount['MEDIUM'] > 0 && (
                            <div className="text-center">
                              <p className="text-xs text-slate-400">MEDIUM</p>
                              <p className="text-lg font-semibold text-yellow-400">
                                {project.severityCount['MEDIUM']}
                              </p>
                            </div>
                          )}
                          {project.severityCount['LOW'] > 0 && (
                            <div className="text-center">
                              <p className="text-xs text-slate-400">LOW</p>
                              <p className="text-lg font-semibold text-blue-400">
                                {project.severityCount['LOW']}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    );
  }

  // Dashboard page
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="rounded bg-emerald-500/10 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-400">
              Trivy
            </span>
            <span className="text-lg font-semibold">Dashboard</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentPage('projects')}
              className="px-3 py-1 text-xs rounded border border-slate-700 hover:bg-slate-800 text-slate-300"
            >
              Projeler →
            </button>
            <span className="text-xs text-slate-400">Prototype UI</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 space-y-6">
        <section className="grid gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Toplam Proje
            </p>
            <p className="mt-2 text-3xl font-semibold">{overallStats.totalProjects}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Toplam Tarama
            </p>
            <p className="mt-2 text-3xl font-semibold">{overallStats.totalScans}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Toplam Açık
            </p>
            <p className="mt-2 text-3xl font-semibold">{overallStats.totalVulns}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Backend URL
            </p>
            <p className="mt-2 text-xs text-slate-300 break-all">
              {API_BASE || 'Tanımlı değil'}
            </p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <div
            className={`rounded-xl border p-4 cursor-pointer transition-all ${
              selectedSeverity === 'CRITICAL'
                ? 'border-rose-500 bg-rose-500/10'
                : 'border-slate-800 bg-slate-900/60 hover:bg-slate-900/80'
            }`}
            onClick={() =>
              setSelectedSeverity(selectedSeverity === 'CRITICAL' ? null : 'CRITICAL')
            }
          >
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              CRITICAL
            </p>
            <p className="mt-2 text-3xl font-semibold text-rose-400">
              {overallStats.severityCount['CRITICAL'] || 0}
            </p>
            {selectedSeverity === 'CRITICAL' && (
              <p className="mt-1 text-xs text-rose-400">Tıklayarak kapat</p>
            )}
          </div>
          <div
            className={`rounded-xl border p-4 cursor-pointer transition-all ${
              selectedSeverity === 'HIGH'
                ? 'border-orange-500 bg-orange-500/10'
                : 'border-slate-800 bg-slate-900/60 hover:bg-slate-900/80'
            }`}
            onClick={() => setSelectedSeverity(selectedSeverity === 'HIGH' ? null : 'HIGH')}
          >
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">HIGH</p>
            <p className="mt-2 text-3xl font-semibold text-orange-400">
              {overallStats.severityCount['HIGH'] || 0}
            </p>
            {selectedSeverity === 'HIGH' && (
              <p className="mt-1 text-xs text-orange-400">Tıklayarak kapat</p>
            )}
          </div>
          <div
            className={`rounded-xl border p-4 cursor-pointer transition-all ${
              selectedSeverity === 'MEDIUM'
                ? 'border-yellow-500 bg-yellow-500/10'
                : 'border-slate-800 bg-slate-900/60 hover:bg-slate-900/80'
            }`}
            onClick={() => setSelectedSeverity(selectedSeverity === 'MEDIUM' ? null : 'MEDIUM')}
          >
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">MEDIUM</p>
            <p className="mt-2 text-3xl font-semibold text-yellow-400">
              {overallStats.severityCount['MEDIUM'] || 0}
            </p>
            {selectedSeverity === 'MEDIUM' && (
              <p className="mt-1 text-xs text-yellow-400">Tıklayarak kapat</p>
            )}
          </div>
          <div
            className={`rounded-xl border p-4 cursor-pointer transition-all ${
              selectedSeverity === 'LOW'
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-slate-800 bg-slate-900/60 hover:bg-slate-900/80'
            }`}
            onClick={() => setSelectedSeverity(selectedSeverity === 'LOW' ? null : 'LOW')}
          >
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">LOW</p>
            <p className="mt-2 text-3xl font-semibold text-blue-400">
              {overallStats.severityCount['LOW'] || 0}
            </p>
            {selectedSeverity === 'LOW' && (
              <p className="mt-1 text-xs text-blue-400">Tıklayarak kapat</p>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-100">Genel Özet</h2>
            <span className="text-xs text-slate-500">
              Tüm projelerin toplam istatistikleri
            </span>
          </div>

          <div className="text-sm text-slate-300 space-y-2">
            <p>
              <span className="text-slate-400">Durum:</span>{' '}
              {loading ? 'Yükleniyor...' : error ? `Hata: ${error}` : 'Hazır'}
            </p>
            <p>
              <span className="text-slate-400">Toplam Proje:</span> {overallStats.totalProjects}
            </p>
            <p>
              <span className="text-slate-400">Toplam Tarama:</span> {overallStats.totalScans}
            </p>
            <p>
              <span className="text-slate-400">Toplam Açık:</span> {overallStats.totalVulns}
            </p>
          </div>

          <div className="mt-4">
            <button
              onClick={() => setCurrentPage('projects')}
              className="px-4 py-2 rounded-lg border border-emerald-700 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-medium transition-colors"
            >
              Tüm Projeleri Görüntüle →
            </button>
          </div>
        </section>

        {selectedSeverity && projectsBySeverity.length > 0 && (
          <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-100">
                {selectedSeverity} Severity'ye Sahip Projeler ({projectsBySeverity.length})
              </h2>
              <button
                onClick={() => setSelectedSeverity(null)}
                className="px-3 py-1 text-xs rounded border border-slate-700 hover:bg-slate-800 text-slate-300"
              >
                Kapat
              </button>
            </div>

            <div className="space-y-3">
              {projectsBySeverity.map((project) => (
                <div
                  key={project.projectName}
                  className="border border-slate-800 rounded-lg p-4 bg-slate-950/60 hover:bg-slate-900/40 cursor-pointer transition-colors"
                  onClick={() => {
                    setSelectedProject(project.projectName);
                    setCurrentPage('project-detail');
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-100">
                        {project.projectName}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        {project.totalScans} tarama • Son tarama:{' '}
                        {new Date(project.lastScan).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-xs text-slate-400">Toplam Açık</span>
                        <p className="text-2xl font-semibold text-slate-100">
                          {project.totalVulns}
                        </p>
                      </div>
                      <div className="flex gap-3 text-sm">
                        {project.severityCount['CRITICAL'] > 0 && (
                          <div className="text-center">
                            <p className="text-xs text-slate-400">CRITICAL</p>
                            <p className="text-lg font-semibold text-rose-400">
                              {project.severityCount['CRITICAL']}
                            </p>
                          </div>
                        )}
                        {project.severityCount['HIGH'] > 0 && (
                          <div className="text-center">
                            <p className="text-xs text-slate-400">HIGH</p>
                            <p className="text-lg font-semibold text-orange-400">
                              {project.severityCount['HIGH']}
                            </p>
                          </div>
                        )}
                        {project.severityCount['MEDIUM'] > 0 && (
                          <div className="text-center">
                            <p className="text-xs text-slate-400">MEDIUM</p>
                            <p className="text-lg font-semibold text-yellow-400">
                              {project.severityCount['MEDIUM']}
                            </p>
                          </div>
                        )}
                        {project.severityCount['LOW'] > 0 && (
                          <div className="text-center">
                            <p className="text-xs text-slate-400">LOW</p>
                            <p className="text-lg font-semibold text-blue-400">
                              {project.severityCount['LOW']}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {selectedSeverity && projectsBySeverity.length === 0 && (
          <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-100">
                {selectedSeverity} Severity'ye Sahip Projeler
              </h2>
              <button
                onClick={() => setSelectedSeverity(null)}
                className="px-3 py-1 text-xs rounded border border-slate-700 hover:bg-slate-800 text-slate-300"
              >
                Kapat
              </button>
            </div>
            <div className="text-center py-8 text-slate-400">
              {selectedSeverity} severity'sine sahip proje bulunamadı.
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
