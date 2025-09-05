// att-helper.js — runs the attendance overlay. Designed to be loaded into the page context.
(function(){
  if (window.__attHelperLoaded) return;
  window.__attHelperLoaded = true;

  (async function(){
    try {
      const btns = document.querySelectorAll("a[ng-click^='getAttendanceData']");
      if (!btns.length) { alert("Open the My Courses page first."); return; }
      const cids = [...btns].map(b => {
        const m = b.getAttribute("ng-click").match(/'([^']+)'/);
        return m ? m[1].replace(',', '') : null;
      }).filter(Boolean);

      let rollMatch = document.body.innerText.match(/\b\d{5}\b/);
      let roll = rollMatch ? rollMatch[0] : prompt("Enter your roll number (5 digits)");
      if (!roll) { alert("Roll number is required."); return; }

      const getOne = async (cid) => {
        try {
          const resp = await fetch("/secure/studentMyCourseAttendance", {
            method: "POST",
            headers: {"Content-Type":"application/json"},
            body: JSON.stringify({ courseId: cid + ",", roll: parseInt(roll,10) })
          });
          const d = await resp.json();
          const present = d.presentClasses || 0;
          const total = d.totalClasses || 0;
          const percent = total ? (present / total * 100) : 0;
          const leaves = total ? Math.floor((present / 0.75) - total) : 0;
          return { cid, present, total, percent: +percent.toFixed(2), leaves };
        } catch (err) {
          return { cid, present:0, total:0, percent:0, leaves:0 };
        }
      };

      const results = await Promise.all(cids.map(getOne));

      const old = document.getElementById("att-helper-overlay");
      if (old) old.remove();

      const overlay = document.createElement("div");
      overlay.id = "att-helper-overlay";
      overlay.style = "position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:999999;display:flex;align-items:center;justify-content:center;padding:16px;";

      const panel = document.createElement("div");
      panel.style = "background:#fff;max-width:520px;width:100%;max-height:80vh;overflow:auto;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.2);padding:16px;font-family:system-ui,Arial,sans-serif";

      panel.innerHTML = "<div style='display:flex;justify-content:space-between;align-items:center;margin-bottom:8px'><div style='font-weight:600'>📊 Attendance Helper</div><button id='att-close' style='border:none;background:#eee;padding:6px 10px;border-radius:8px;cursor:pointer'>Close</button></div>";

      const table = document.createElement("table");
      table.style = "width:100%;border-collapse:collapse;font-size:14px";
      table.innerHTML = "<thead><tr><th style='border-bottom:1px solid #ddd;padding:6px;text-align:left'>Course</th><th style='border-bottom:1px solid #ddd;padding:6px'>Attended</th><th style='border-bottom:1px solid #ddd;padding:6px'>Total</th><th style='border-bottom:1px solid #ddd;padding:6px'>%</th><th style='border-bottom:1px solid #ddd;padding:6px'>Leaves</th></tr></thead>";

      const tbody = document.createElement("tbody");
      results.forEach(r => {
        const tr = document.createElement("tr");
        if (r.percent < 75) tr.style.background = "#ffecec";
        tr.innerHTML = "<td style='padding:6px;border-bottom:1px solid #f0f0f0'>" + r.cid + "</td>"
                     + "<td style='padding:6px;border-bottom:1px solid #f0f0f0;text-align:center'>" + r.present + "</td>"
                     + "<td style='padding:6px;border-bottom:1px solid #f0f0f0;text-align:center'>" + r.total + "</td>"
                     + "<td style='padding:6px;border-bottom:1px solid #f0f0f0;text-align:center'>" + r.percent.toFixed(2) + "</td>"
                     + "<td style='padding:6px;border-bottom:1px solid #f0f0f0;text-align:center'>" + r.leaves + "</td>";
        tbody.appendChild(tr);
      });

      table.appendChild(tbody);
      panel.appendChild(table);
      overlay.appendChild(panel);
      document.body.appendChild(overlay);

      document.getElementById('att-close').onclick = () => overlay.remove();

    } catch (err) {
      alert("Attendance Helper error: " + (err && err.message ? err.message : err));
    }
  })();
})();
