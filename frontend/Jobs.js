import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { CSVLink } from "react-csv";

function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCharts, setShowCharts] = useState(true);
  const [toast, setToast] = useState({ show: false, msg: "", type: "" });
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  // 1. SAVED JOBS - localStorage
  const [savedJobs, setSavedJobs] = useState(() => {
    const saved = localStorage.getItem("savedJobs");
    return saved? JSON.parse(saved) : [];
  });

  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 5;

  const [form, setForm] = useState({
    title: "",
    company: "",
    location: "",
    salary: "",
  });

  const [errors, setErrors] = useState({});

  // Save to localStorage whenever savedJobs changes
  useEffect(() => {
    localStorage.setItem("savedJobs", JSON.stringify(savedJobs));
  }, [savedJobs]);

  const showToast = (msg, type = "success") => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: "", type: "" }), 3000);
  };

  const fetchJobs = () => {
    setLoading(true);
    axios
  .get("http://localhost:5000/api/jobs")
  .then((res) => setJobs(res.data))
  .catch((err) => {
        console.log(err);
        showToast("Failed to fetch jobs", "error");
      })
  .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({...form, [name]: value });
    if (errors[name]) {
      setErrors({...errors, [name]: "" });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.title.trim()) newErrors.title = "Title is required";
    if (!form.company.trim()) newErrors.company = "Company is required";
    if (!form.location.trim()) newErrors.location = "City is required";
    if (!form.salary.toString().trim()) {
      newErrors.salary = "Salary is required";
    } else if (isNaN(form.salary) || Number(form.salary) <= 0) {
      newErrors.salary = "Salary must be a valid number > 0";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    setLoading(true);

    const payload = {
      title: form.title.trim(),
      company: form.company.trim(),
      location: form.location.trim(),
      salary: Number(form.salary),
    };

    if (editId) {
      axios
    .put(`http://localhost:5000/api/jobs/${editId}`, payload)
    .then(() => {
          showToast("Job Updated ✅");
          fetchJobs();
          resetForm();
        })
    .catch((err) => {
          console.log("Update error:", err.response?.data || err);
          showToast("Failed to update job", "error");
        })
    .finally(() => setLoading(false));
    } else {
      axios
    .post("http://localhost:5000/api/jobs", payload)
    .then(() => {
          showToast("Job Added ✅");
          fetchJobs();
          resetForm();
        })
    .catch((err) => {
          console.log(err);
          showToast("Failed to add job", "error");
        })
    .finally(() => setLoading(false));
    }
  };

  const resetForm = () => {
    setEditId(null);
    setForm({ title: "", company: "", location: "", salary: "" });
    setErrors({});
  };

  const handleDelete = (id) => {
    if (!window.confirm("Delete this job?")) return;
    setLoading(true);
    axios
  .delete(`http://localhost:5000/api/jobs/${id}`)
  .then(() => {
        showToast("Job Deleted ✅");
        fetchJobs();
      })
  .catch((err) => {
        console.log(err);
        showToast("Failed to delete job", "error");
      })
  .finally(() => setLoading(false));
  };

  const handleEdit = (job) => {
    setEditId(job._id);
    setForm({
      title: job.title || "",
      company: job.company || "",
      location: job.location || "",
      salary: job.salary!== undefined? job.salary.toString() : "",
    });
    setErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleApply = (job) => {
    showToast(`Applied Successfully ✅\n${job.title} at ${job.company}`);
  };

  // 2. SAVE/UNSAVE JOB - Frontend only
  const toggleSaveJob = (jobId) => {
    if (savedJobs.includes(jobId)) {
      setSavedJobs(savedJobs.filter(id => id!== jobId));
      showToast("Job Removed from Saved 💔");
    } else {
      setSavedJobs([...savedJobs, jobId]);
      showToast("Job Saved Successfully ❤️");
    }
  };

  const normalizeName = (name) => {
    if (!name) return "";
    return name.trim().toLowerCase().split(' ').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const uniqueCompanies = useMemo(() => {
    const normalized = jobs.map(j => normalizeName(j.company)).filter(Boolean);
    return [...new Set(normalized)];
  }, );

  const uniqueCities = useMemo(() => {
    const normalized = jobs.map(j => normalizeName(j.location)).filter(Boolean);
    return [...new Set(normalized)];
  }, );

  const salaryStats = useMemo(() => {
    if (jobs.length === 0) return { highest: 0, average: 0, total: 0 };
    const salaries = jobs.map(job => Number(job.salary) || 0).filter(s => s > 0);
    if (salaries.length === 0) return { highest: 0, average: 0, total: 0 };
    const total = salaries.reduce((sum, sal) => sum + sal, 0);
    const highest = Math.max(...salaries);
    const average = Math.round(total / salaries.length);
    return { highest, average, total };
  }, );

  const cityData = useMemo(() => {
    const cityMap = {};
    jobs.forEach(job => {
      const city = normalizeName(job.location);
      if (city) cityMap[city] = (cityMap[city] || 0) + 1;
    });
    return Object.entries(cityMap)
  .map(([name, jobs]) => ({ name, jobs }))
  .sort((a, b) => b.jobs - a.jobs)
  .slice(0, 8);
  }, );

  const companyData = useMemo(() => {
    const companyMap = {};
    jobs.forEach(job => {
      const company = normalizeName(job.company);
      if (company) companyMap[company] = (companyMap[company] || 0) + 1;
    });
    return Object.entries(companyMap)
  .map(([name, jobs]) => ({ name, jobs }))
  .sort((a, b) => b.jobs - a.jobs)
  .slice(0, 8);
  }, );

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

  // FILTER + SORT + SAVED FILTER
  const filteredJobs = useMemo(() => {
    let filtered = jobs.filter((job) => {
      const title = job.title?.toLowerCase() || "";
      const company = job.company?.toLowerCase() || "";
      const location = job.location?.toLowerCase() || "";
      const search = searchTerm.toLowerCase().trim();
      const city = cityFilter.toLowerCase().trim();
      const matchSearch = title.includes(search) || company.includes(search);
      const matchCity = city === "" || location.includes(city);
      const matchSaved =!showSavedOnly || savedJobs.includes(job._id);
      return matchSearch && matchCity && matchSaved;
    });

    switch (sortBy) {
      case "salary-high":
        return filtered.sort((a, b) => b.salary - a.salary);
      case "salary-low":
        return filtered.sort((a, b) => a.salary - b.salary);
      case "title-az":
        return filtered.sort((a, b) => a.title.localeCompare(b.title));
      case "newest":
      default:
        return filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }
  }, [jobs, searchTerm, cityFilter, sortBy, showSavedOnly, savedJobs]);

  // 3. CSV EXPORT DATA
  const csvData = useMemo(() => {
    return filteredJobs.map(job => ({
      Title: job.title,
      Company: job.company,
      City: job.location,
      Salary: job.salary,
      Saved: savedJobs.includes(job._id)? "Yes" : "No"
    }));
  }, [filteredJobs, savedJobs]);

  const indexOfLastJob = currentPage * jobsPerPage;
  const indexOfFirstJob = indexOfLastJob - jobsPerPage;
  const currentJobs = filteredJobs.slice(indexOfFirstJob, indexOfLastJob);
  const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);

  return (
    <div style={containerStyle}>
      {toast.show && (
        <div style={{...toastStyle, backgroundColor: toast.type === "error"? "#ef4444" : "#10b981" }}>
          {toast.type === "error"? "❌" : "✅"} {toast.msg}
        </div>
      )}

      <div style={maxWidthWrap}>
        <div style={heroSection}>
          <h1 style={titleStyle}>
            Job<span style={{ color: "#3b82f6" }}>Portal</span>
          </h1>
          <p style={subtitleStyle}>Find Jobs. Hire Talent. One Platform.</p>
          <p style={descStyle}>A simple platform connecting Job Seekers and Recruiters.</p>
        </div>

        <div style={glassCard}>
          <h2 style={sectionTitle}>Platform Features</h2>
          <div style={featuresGrid}>
            <FeatureItem icon="🔍" title="Search Jobs" desc="Find jobs by title or company" />
            <FeatureItem icon="🏙️" title="Filter by City" desc="Browse jobs in your city" />
            <FeatureItem icon="❤️" title="Save Jobs" desc="Bookmark jobs for later" />
            <FeatureItem icon="📊" title="Job Management" desc="Full CRUD for listings" />
          </div>
        </div>

        <div style={statsGrid}>
          <StatCard icon="💼" number={jobs.length} label="Total Jobs" color="#3b82f6" />
          <StatCard icon="🏢" number={uniqueCompanies.length} label="Companies" color="#10b981" />
          <StatCard icon="📍" number={uniqueCities.length} label="Cities" color="#f59e0b" />
          <StatCard icon="❤️" number={savedJobs.length} label="Saved Jobs" color="#ec4899" />
          <StatCard icon="💰" number={`₹${salaryStats.highest.toLocaleString()}`} label="Highest Salary" color="#ef4444" />
          <StatCard icon="📊" number={`₹${salaryStats.average.toLocaleString()}`} label="Average Salary" color="#8b5cf6" />
        </div>

        <div style={glassCard}>
          <div style={cardHeader}>
            <h3 style={cardTitle}>📊 Dashboard Analytics</h3>
            <button onClick={() => setShowCharts(!showCharts)} style={toggleBtn}>
              {showCharts? "Hide Charts" : "Show Charts"}
            </button>
          </div>

          {showCharts && (
            <div style={chartsGrid}>
              <div style={chartCard}>
                <h4 style={chartTitle}>Jobs by City</h4>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={cityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="jobs" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={chartCard}>
                <h4 style={chartTitle}>Jobs by Company</h4>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={companyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="jobs" fill="#10b981" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={chartCard}>
                <h4 style={chartTitle}>Top Cities Distribution</h4>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={cityData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={90}
                      dataKey="jobs"
                    >
                      {cityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        <div style={glassCard}>
          <div style={cardHeader}>
            <h3 style={cardTitle}>{editId? "✏️ Update Job" : "➕ Add New Job"}</h3>
            {editId && (
              <button onClick={resetForm} style={cancelIconBtn}>
                ✕ Cancel
              </button>
            )}
          </div>

          <div style={formGrid}>
            <InputField label="Job Title" name="title" value={form.title} onChange={handleChange} error={errors.title} placeholder="e.g. Frontend Developer" />
            <InputField label="Company" name="company" value={form.company} onChange={handleChange} error={errors.company} placeholder="e.g. Google" />
            <InputField label="City" name="location" value={form.location} onChange={handleChange} error={errors.location} placeholder="e.g. Bangalore" />
            <InputField label="Salary" name="salary" value={form.salary} onChange={handleChange} error={errors.salary} placeholder="e.g. 800000" type="number" />
          </div>

          <button onClick={handleSubmit} style={{...primaryBtn, opacity: loading? 0.6 : 1 }} disabled={loading}>
            {loading? "Processing..." : editId? "Update Job" : "Add Job"}
          </button>
        </div>

        <div style={glassCard}>
          <div style={filterBar}>
            <div style={searchWrap}>
              <span style={searchIcon}>🔍</span>
              <input
                type="text"
                placeholder="Search by title or company..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                style={searchInput}
              />
            </div>

            <select
              value={cityFilter}
              onChange={(e) => {
                setCityFilter(e.target.value);
                setCurrentPage(1);
              }}
              style={selectStyle}
            >
              <option value="">All Cities</option>
              {uniqueCities.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setCurrentPage(1);
              }}
              style={selectStyle}
            >
              <option value="newest">Newest First</option>
              <option value="salary-high">Salary: High to Low</option>
              <option value="salary-low">Salary: Low to High</option>
              <option value="title-az">Title: A to Z</option>
            </select>

            <button
              onClick={() => setShowSavedOnly(!showSavedOnly)}
              style={{...selectStyle, backgroundColor: showSavedOnly? "#ec4899" : "#fff", color: showSavedOnly? "#fff" : "#374151", cursor: "pointer", border: "2px solid #e5e7eb"}}
            >
              {showSavedOnly? "❤️ Show All" : "❤️ Saved Only"}
            </button>

            <CSVLink
              data={csvData}
              filename={"jobs_export.csv"}
              style={{...selectStyle, backgroundColor: "#10b981", color: "#fff", cursor: "pointer", textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", border: "none"}}
            >
              📄 Export CSV
            </CSVLink>
          </div>
        </div>

        <div style={glassCard}>
          {loading && jobs.length === 0? (
            <div style={loadingWrap}>
              <div style={spinner}></div>
              <p style={loadingText}>Loading...</p>
            </div>
          ) : (
            <>
              <div style={{ overflowX: "auto" }}>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Title</th>
                      <th style={thStyle}>Company</th>
                      <th style={thStyle}>City</th>
                      <th style={thStyle}>Salary</th>
                      <th style={thStyle}>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {currentJobs.length > 0? (
                      currentJobs.map((job) => (
                        <tr key={job._id} style={trStyle}>
                          <td style={tdStyle}><strong>{job.title}</strong></td>
                          <td style={tdStyle}>{job.company}</td>
                          <td style={tdStyle}><span style={cityBadge}>{normalizeName(job.location)}</span></td>
                          <td style={tdStyle}><span style={salaryText}>₹{Number(job.salary).toLocaleString()}</span></td>
                          <td style={tdStyle}>
                            <button onClick={() => toggleSaveJob(job._id)} style={saveBtn}>
                              {savedJobs.includes(job._id)? "❤️" : "🤍"}
                            </button>
                            <button onClick={() => handleApply(job)} style={applyBtn}>Apply</button>
                            <button onClick={() => handleEdit(job)} style={iconBtn} title="Edit">✏️</button>
                            <button onClick={() => handleDelete(job._id)} style={iconBtn} title="Delete">🗑️</button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" style={emptyTd}>
                          <div style={emptyState}>
                            <div style={{ fontSize: "3rem", marginBottom: "8px" }}>📭</div>
                            {loading? "Loading..." : showSavedOnly? "No Saved Jobs" : "No Jobs Found"}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div style={paginationWrap}>
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                    style={{...pageBtn, opacity: currentPage === 1? 0.4 : 1 }}
                  >
                    ← Prev
                  </button>
                  <span style={pageText}>Page {currentPage} of {totalPages}</span>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                    style={{...pageBtn, opacity: currentPage === totalPages? 0.4 : 1 }}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// COMPONENTS
const FeatureItem = ({ icon, title, desc }) => (
  <div style={featureItem}>
    <div style={featureIcon}>{icon}</div>
    <div>
      <h4 style={featureTitle}>{title}</h4>
      <p style={featureDesc}>{desc}</p>
    </div>
  </div>
);

const StatCard = ({ icon, number, label, color }) => (
  <div style={{...statCard, borderTop: `3px solid ${color}` }}>
    <div style={{ fontSize: "2.2rem", marginBottom: "8px" }}>{icon}</div>
    <h3 style={{...statNumber, color }}>{number}</h3>
    <p style={statLabel}>{label}</p>
  </div>
);

const InputField = ({ label, name, value, onChange, error, placeholder, type = "text" }) => (
  <div>
    <label style={labelStyle}>{label}</label>
    <input
      name={name}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      style={{...inputStyle, borderColor: error? "#ef4444" : "#e5e7eb" }}
    />
    {error && <div style={errorStyle}>{error}</div>}
  </div>
);

// STYLES
const containerStyle = {
  padding: "20px",
  fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  minHeight: "100vh",
};

const maxWidthWrap = { maxWidth: "1200px", margin: "0 auto" };

const toastStyle = {
  position: "fixed",
  top: "20px",
  right: "20px",
  padding: "14px 20px",
  borderRadius: "10px",
  color: "white",
  fontWeight: "600",
  zIndex: 9999,
  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
  animation: "slideIn 0.3s ease",
  whiteSpace: "pre-line"
};

const heroSection = { textAlign: "center", marginBottom: "30px", color: "#fff", padding: "40px 20px" };
const titleStyle = { fontSize: "3.5rem", margin: "0 0 12px 0", fontWeight: "800", color: "#fff", letterSpacing: "-1px" };
const subtitleStyle = { fontSize: "1.3rem", margin: "0 0 8px 0", opacity: 0.95, fontWeight: "600" };
const descStyle = { fontSize: "1rem", margin: 0, opacity: 0.85 };
const sectionTitle = { margin: "0 0 24px 0", color: "#1f2937", fontSize: "1.5rem", fontWeight: "700", textAlign: "center" };
const featuresGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px" };
const featureItem = { display: "flex", gap: "16px", alignItems: "flex-start" };
const featureIcon = { fontSize: "2rem", lineHeight: 1 };
const featureTitle = { margin: "0 0 4px 0", color: "#1f2937", fontSize: "1rem", fontWeight: "600" };
const featureDesc = { margin: 0, color: "#6b7280", fontSize: "0.9rem" };
const statsGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "20px", marginBottom: "24px" };
const statCard = { backgroundColor: "rgba(255, 255, 255, 0.95)", backdropFilter: "blur(10px)", padding: "28px 20px", borderRadius: "16px", boxShadow: "0 8px 32px rgba(0,0,0,0.1)", textAlign: "center", transition: "transform 0.2s" };
const statNumber = { fontSize: "1.5rem", fontWeight: "700", margin: "0 0 4px 0" };
const statLabel = { color: "#6b7280", fontSize: "0.7rem", margin: 0, fontWeight: "500", textTransform: "uppercase", letterSpacing: "0.5px" };
const glassCard = { backgroundColor: "rgba(255, 255, 255, 0.95)", backdropFilter: "blur(10px)", padding: "28px", borderRadius: "16px", boxShadow: "0 8px 32px rgba(0,0,0,0.1)", marginBottom: "20px", border: "1px solid rgba(255,255,255,0.3)" };
const cardHeader = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" };
const cardTitle = { margin: 0, color: "#1f2937", fontSize: "1.4rem", fontWeight: "700" };
const toggleBtn = { padding: "8px 16px", border: "2px solid #3b82f6", borderRadius: "8px", backgroundColor: "#eff6ff", color: "#1e40af", cursor: "pointer", fontSize: "14px", fontWeight: "600" };
const chartsGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px", marginTop: "20px" };
const chartCard = { padding: "16px", backgroundColor: "#f9fafb", borderRadius: "12px" };
const chartTitle = { margin: "0 0 16px 0", color: "#374151", fontSize: "1rem", fontWeight: "600", textAlign: "center" };
const cancelIconBtn = { padding: "8px 16px", border: "2px solid #e5e7eb", borderRadius: "8px", backgroundColor: "#fff", cursor: "pointer", fontSize: "14px", fontWeight: "600", color: "#6b7280" };
const formGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px", marginBottom: "20px" };
const labelStyle = { display: "block", marginBottom: "6px", color: "#374151", fontSize: "14px", fontWeight: "600" };
const inputStyle = { padding: "12px 14px", width: "100%", border: "2px solid #e5e7eb", borderRadius: "10px", fontSize: "14px", outline: "none", boxSizing: "border-box", transition: "border 0.2s" };
const errorStyle = { color: "#ef4444", fontSize: "12px", marginTop: "6px", fontWeight: "500" };
const primaryBtn = { padding: "12px 28px", border: "none", borderRadius: "10px", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "white", cursor: "pointer", fontSize: "15px", fontWeight: "600", boxShadow: "0 4px 12px rgba(102, 126, 234, 0.4)", transition: "transform 0.2s" };
const filterBar = { display: "flex", gap: "12px", flexWrap: "wrap" };
const searchWrap = { position: "relative", flex: "1", minWidth: "200px" };
const searchIcon = { position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", fontSize: "16px" };
const searchInput = { padding: "12px 12px 12px 42px", width: "100%", border: "2px solid #e5e7eb", borderRadius: "10px", fontSize: "14px", outline: "none", boxSizing: "border-box" };
const selectStyle = { padding: "12px 14px", border: "2px solid #e5e7eb", borderRadius: "10px", fontSize: "14px", outline: "none", minWidth: "140px", backgroundColor: "#fff" };
const tableStyle = { width: "100%", borderCollapse: "separate", borderSpacing: "0" };
const thStyle = { padding: "14px", background: "#f9fafb", textAlign: "left", fontWeight: "700", color: "#374151", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "2px solid #e5e7eb" };
const tdStyle = { padding: "16px 14px", color: "#4b5563", borderBottom: "1px solid #f3f4f6" };
const trStyle = { transition: "background 0.2s" };
const cityBadge = { padding: "4px 10px", backgroundColor: "#dbeafe", color: "#1e40af", borderRadius: "6px", fontSize: "13px", fontWeight: "500" };
const salaryText = { color: "#059669", fontWeight: "700" };
const iconBtn = { padding: "8px 10px", marginRight: "6px", border: "none", borderRadius: "8px", backgroundColor: "#f3f4f6", cursor: "pointer", fontSize: "16px", transition: "background 0.2s" };
const applyBtn = { padding: "8px 16px", marginRight: "6px", border: "none", borderRadius: "8px", backgroundColor: "#3b82f6", color: "white", cursor: "pointer", fontSize: "14px", fontWeight: "600" };
const saveBtn = { padding: "8px 10px", marginRight: "6px", border: "none", borderRadius: "8px", backgroundColor: "#fef3c7", cursor: "pointer", fontSize: "18px" };
const emptyTd = { padding: "60px 20px", textAlign: "center" };
const emptyState = { color: "#9ca3af", fontSize: "16px" };
const paginationWrap = { marginTop: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" };
const pageBtn = { padding: "10px 18px", border: "2px solid #e5e7eb", borderRadius: "10px", backgroundColor: "#fff", cursor: "pointer", fontSize: "14px", fontWeight: "600", color: "#374151" };
const pageText = { color: "#6b7280", fontSize: "14px", fontWeight: "600" };

const loadingWrap = { textAlign: "center", padding: "60px 20px" };
const spinner = {
  width: "40px",
  height: "40px",
  border: "4px solid #e5e7eb",
  borderTop: "4px solid #3b82f6",
  borderRadius: "50%",
  margin: "0 auto 16px",
  animation: "spin 1s linear infinite"
};
const loadingText = { color: "#6b7280", fontSize: "16px", margin: 0 };

const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
`;
document.head.appendChild(styleSheet);

export default Jobs;