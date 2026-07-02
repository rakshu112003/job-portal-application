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
     .get("https://job-portal-application-5-tc2n.onrender.com/api/jobs")
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
       .put(`https://job-portal-application-5-tc2n.onrender.com/api/jobs/${editId}`, payload)
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
       .post("https://job-portal-application-5-tc2n.onrender.com/api/jobs", payload)
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
     .delete(`https://job-portal-application-5-tc2n.onrender.com/api/jobs/${id}`)
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

  const toggleSaveJob = (jobId) => {
    if (savedJobs.includes(jobId)) {
      setSavedJobs(savedJobs.filter((id) => id!== jobId));
      showToast("Job Removed from Saved 💔");
    } else {
      setSavedJobs([...savedJobs, jobId]);
      showToast("Job Saved Successfully ❤️");
    }
  };

  const normalizeName = (name) => {
    if (!name) return "";
    return name
     .trim()
     .toLowerCase()
     .split(" ")
     .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
     .join(" ");
  };

  const uniqueCompanies = useMemo(() => {
    const normalized = jobs.map((j) => normalizeName(j.company)).filter(Boolean);
    return [...new Set(normalized)];
  }, [jobs]);

  const uniqueCities = useMemo(() => {
    const normalized = jobs.map((j) => normalizeName(j.location)).filter(Boolean);
    return [...new Set(normalized)];
  }, [jobs]);

  const salaryStats = useMemo(() => {
    if (jobs.length === 0) return { highest: 0, average: 0, total: 0 };
    const salaries = jobs.map((job) => Number(job.salary) || 0).filter((s) => s > 0);
    if (salaries.length === 0) return { highest: 0, average: 0, total: 0 };
    const total = salaries.reduce((sum, sal) => sum + sal, 0);
    const highest = Math.max(...salaries);
    const average = Math.round(total / salaries.length);
    return { highest, average, total };
  }, [jobs]);

  const cityData = useMemo(() => {
    const cityMap = {};
    jobs.forEach((job) => {
      const city = normalizeName(job.location);
      if (city) cityMap[city] = (cityMap[city] || 0) + 1;
    });
    return Object.entries(cityMap)
     .map(([name, jobs]) => ({ name, jobs }))
     .sort((a, b) => b.jobs - a.jobs)
     .slice(0, 8);
  }, [jobs]);

  const companyData = useMemo(() => {
    const companyMap = {};
    jobs.forEach((job) => {
      const company = normalizeName(job.company);
      if (company) companyMap[company] = (companyMap[company] || 0) + 1;
    });
    return Object.entries(companyMap)
     .map(([name, jobs]) => ({ name, jobs }))
     .sort((a, b) => b.jobs - a.jobs)
     .slice(0, 8);
  }, [jobs]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

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
              style={{...selectStyle, backgroundColor: showSavedOnly? "#ec4899" : "#fff", color: showSavedOnly? "#fff" : "#374151", cursor: "pointer", border: "2px solid #e5e7eb" }}
            >
              {showSavedOnly? "❤️ Show All" : "❤️ Saved Only"}
            </button>

            <CSVLink
              data={csvData}
              filename={"jobs_export.csv"}
              style={{...selectStyle, backgroundColor: "#10b981", color: "#fff", cursor: "pointer", textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", border: "none" }}
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

// ===== ALL STYLES & COMPONENTS =====
const containerStyle = { minHeight: "100vh", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", padding: "20px", fontFamily: "'Inter', sans-serif" };
const maxWidthWrap = { maxWidth: "1200px", margin: "0 auto" };
const heroSection = { textAlign: "center", color: "#fff", padding: "40px 20px" };
const titleStyle = { fontSize: "3rem", fontWeight: "800", margin: "0" };
const subtitleStyle = { fontSize: "1.2rem", margin: "10px 0" };
const descStyle = { fontSize: "1rem", opacity: "0.9" };
const glassCard = { background: "rgba(255,255,255,0.95)", borderRadius: "16px", padding: "24px", marginBottom: "20px", boxShadow: "0 8px 32px rgba(0,0,0,0.1)" };
const sectionTitle = { fontSize: "1.5rem", marginBottom: "16px" };
const featuresGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" };
const featureItem = { display: "flex", gap: "12px", alignItems: "center" };
const featureIcon = { fontSize: "2rem" };
const featureTitle = { fontSize: "1rem", margin: "0", fontWeight: "600" };
const featureDesc = { fontSize: "0.85rem", margin: "0", color: "#6b7280" };
const statsGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "16px", marginBottom: "20px" };
const statCard = { background: "#fff", borderRadius: "12px", padding: "20px", textAlign: "center", borderTop: "4px solid #3b82f6" };
const statNumber = { fontSize: "1.8rem", fontWeight: "700", margin: "8px 0" };
const statLabel = { fontSize: "0.85rem", color: "#6b7280" };
const cardHeader = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" };
const cardTitle = { fontSize: "1.2rem", margin: "0" };
const toggleBtn = { padding: "8px 16px", border: "none", borderRadius: "8px", background: "#3b82f6", color: "#fff", cursor: "pointer", fontWeight: "600" };
const chartsGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" };
const chartCard = { background: "#f9fafb", padding: "16px", borderRadius: "12px" };
const chartTitle = { fontSize: "1rem", marginBottom: "12px", textAlign: "center", fontWeight: "600" };
const formGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", marginBottom: "16px" };
const inputWrap = { display: "flex", flexDirection: "column" };
const labelStyle = { fontSize: "0.85rem", fontWeight: "600", marginBottom: "4px" };
const inputStyle = { padding: "10px", border: "2px solid #e5e7eb", borderRadius: "8px", fontSize: "0.9rem" };
const errorText = { color: "#ef4444", fontSize: "0.75rem", marginTop: "4px" };
const primaryBtn = { width: "100%", padding: "12px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: "8px", fontSize: "1rem", fontWeight: "600", cursor: "pointer" };
const cancelIconBtn = { padding: "8px 16px", background: "#ef4444", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600" };
const filterBar = { display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" };
const searchWrap = { position: "relative", flex: "1", minWidth: "200px" };
const searchIcon = { position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", zIndex: 1 };
// 🔥 UI FIX: paddingLeft 40px maadidini, 40px bottom alli alla
const searchInput = { width: "100%", padding: "10px 10px 10px 40px", border: "2px solid #e5e7eb", borderRadius: "8px", fontSize: "0.9rem" };
const selectStyle = { padding: "10px", border: "2px solid #e5e7eb", borderRadius: "8px", minWidth: "150px", fontSize: "0.9rem", cursor: "pointer" };
const loadingWrap = { textAlign: "center", padding: "40px" };
const spinner = { border: "4px solid #f3f4f6", borderTop: "4px solid #3b82f6", borderRadius: "50%", width: "40px", height: "40px", animation: "spin 1s linear infinite", margin: "0 auto" };
const loadingText = { marginTop: "12px", color: "#6b7280" };
const tableStyle = { width: "100%", borderCollapse: "collapse" };
const thStyle = { padding: "12px", textAlign: "left", borderBottom: "2px solid #e5e7eb", fontSize: "0.85rem", fontWeight: "600", color: "#374151" };
const trStyle = { borderBottom: "1px solid #f3f4f6" };
const tdStyle = { padding: "12px", fontSize: "0.9rem" };
const cityBadge = { background: "#dbeafe", color: "#1e40af", padding: "4px 8px", borderRadius: "6px", fontSize: "0.8rem", fontWeight: "500" };
const salaryText = { fontWeight: "600", color: "#059669" };
const saveBtn = { background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", marginRight: "8px" };
const applyBtn = { padding: "6px 12px", background: "#10b981", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", marginRight: "8px", fontSize: "0.8rem", fontWeight: "600" };
const iconBtn = { background: "none", border: "none", fontSize: "1rem", cursor: "pointer", marginRight: "4px", padding: "4px" };
const emptyTd = { padding: "40px", textAlign: "center" };
const emptyState = { color: "#6b7280" };
const paginationWrap = { display: "flex", justifyContent: "center", alignItems: "center", gap: "16px", marginTop: "20px" };
const pageBtn = { padding: "8px 16px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600" };
const pageText = { fontSize: "0.9rem", fontWeight: "600" };
const toastStyle = { position: "fixed", top: "20px", right: "20px", padding: "12px 20px", borderRadius: "8px", color: "#fff", fontWeight: "600", zIndex: "9999", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" };

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
  <div style={{...statCard, borderTop: `4px solid ${color}` }}>
    <div style={{ fontSize: "2rem" }}>{icon}</div>
    <div style={statNumber}>{number}</div>
    <div style={statLabel}>{label}</div>
  </div>
);

const InputField = ({ label, name, value, onChange, error, placeholder, type = "text" }) => (
  <div style={inputWrap}>
    <label style={labelStyle}>{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{...inputStyle, borderColor: error? "#ef4444" : "#e5e7eb" }}
    />
    {error && <span style={errorText}>{error}</span>}
  </div>
);

const styleSheet = document.createElement("style");
styleSheet.innerText = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
document.head.appendChild(styleSheet);

export default Jobs;
