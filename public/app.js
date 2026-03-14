let data = [];
let filteredData = [];

// DOM Elements
const list = document.getElementById('student-list');
const countLabel = document.getElementById('reg-count');
const emptyState = document.getElementById('empty');

async function init() {
    try {
        const response = await fetch('data.csv');
        const blob = await response.text();
        
        Papa.parse(blob, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                data = results.data.map(row => {
                    // 1. Unified Event Name
                    const eventName = row['Choose Technical Event'] || 
                                      row['Choose Art and Culture Event'] || 
                                      row['Choose Non-Technical event'] || 
                                      row['Choose Sports Event'] || 
                                      'General Registration';

                    // 2. Dynamic Team Detection
                    let teamName = "";
                    let members = [];

                    Object.keys(row).forEach(key => {
                        const val = row[key] ? row[key].trim() : "";
                        if(!val) return;

                        const k = key.toLowerCase();
                        // Find Team Name
                        if (k.includes('team name') && !teamName) {
                            teamName = val;
                        }
                        // Find Members/Players/Captains (filtering out contact numbers)
                        if ((k.includes('member') || k.includes('captain') || k.includes('player') || k.includes('leader')) 
                            && !k.includes('contact') && !k.includes('mobile') && !k.includes('no.') && !k.includes('year')) {
                            if (!members.includes(val)) members.push(val);
                        }
                    });

                    return {
                        name: row['NAME'] || 'Unknown',
                        college: row['SELECT YOUR COLLEGE'] || '',
                        branch: row['BRANCH'] || '',
                        category: row['EVENT CATEGORY'] || '',
                        mobile: row['MOBILE NO.'] || '',
                        event: eventName.trim(),
                        teamName: teamName,
                        members: members
                    };
                });
                populateFilters();
                render();
            }
        });
    } catch (err) {
        console.error("Data load failed", err);
    }
}

function populateFilters() {
    const getUnique = (key) => [...new Set(data.map(d => d[key]).filter(Boolean))].sort();
    fillSelect('f-college', getUnique('college'));
    fillSelect('f-category', getUnique('category'));
    fillSelect('f-event', getUnique('event'));

    ['search', 'f-college', 'f-category', 'f-event'].forEach(id => {
        document.getElementById(id).addEventListener('input', render);
    });
}

function fillSelect(id, items) {
    const el = document.getElementById(id);
    items.forEach(text => el.add(new Option(text, text)));
}

function render() {
    const q = document.getElementById('search').value.toLowerCase();
    const fCol = document.getElementById('f-college').value;
    const fCat = document.getElementById('f-category').value;
    const fEvt = document.getElementById('f-event').value;

    filteredData = data.filter(d => {
        return (!q || d.name.toLowerCase().includes(q) || (d.teamName && d.teamName.toLowerCase().includes(q))) &&
               (!fCol || d.college === fCol) &&
               (!fCat || d.category === fCat) &&
               (!fEvt || d.event === fEvt);
    });

    countLabel.textContent = filteredData.length;
    list.innerHTML = '';
    emptyState.classList.toggle('hidden', filteredData.length > 0);

    filteredData.forEach(d => {
        const div = document.createElement('div');
        div.className = 'card flex flex-col';
        
        // Team Members List HTML
        const membersHtml = d.members.length > 0 
            ? `<div class="mt-3 bg-slate-50 p-3 rounded-xl">
                <p class="text-[10px] font-bold text-slate-400 uppercase mb-1">Team Roster</p>
                <p class="text-xs text-slate-600 leading-relaxed">${d.members.join(', ')}</p>
               </div>` 
            : '';

        div.innerHTML = `
            <div class="flex justify-between items-start mb-1">
                <h3 class="font-bold text-slate-900">${d.name}</h3>
                <span class="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded-md uppercase shrink-0 ml-2">${d.category}</span>
            </div>
            <p class="text-xs text-slate-500 mb-3">${d.college} ${d.branch ? '• ' + d.branch : ''}</p>
            
            <div class="mb-2">
                <div class="text-sm font-bold text-indigo-600">${d.event}</div>
                ${d.teamName ? `<div class="text-xs font-bold text-slate-700 mt-1 italic">Team: ${d.teamName}</div>` : ''}
            </div>

            ${membersHtml}

            <div class="mt-auto pt-4 border-t border-slate-50 flex justify-between items-center">
                <span class="text-xs font-mono font-bold text-slate-400 tracking-tighter">${d.mobile}</span>
                <a href="tel:${d.mobile}" class="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"></path></svg>
                </a>
            </div>
        `;
        list.appendChild(div);
    });
}

function exportCSV() {
    const csv = Papa.unparse(filteredData);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Innovision_Teams_${Date.now()}.csv`;
    a.click();
}

init();