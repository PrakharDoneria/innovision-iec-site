let data = [];
let filteredData = [];

const list = document.getElementById('student-list');
const countLabel = document.getElementById('reg-count');
const emptyState = document.getElementById('empty');

function toggleLoading(isLoading) {
    if (!isLoading) return;
    list.innerHTML = '';
    for (let i = 0; i < 6; i++) {
        const skeleton = document.createElement('div');
        skeleton.className = 'card flex flex-col gap-3 opacity-70';
        skeleton.innerHTML = `
            <div class="flex justify-between items-center"><div class="h-5 w-32 shimmer rounded-lg"></div><div class="h-4 w-16 shimmer rounded-lg"></div></div>
            <div class="h-3 w-48 shimmer rounded-lg"></div>
            <div class="mt-4 h-12 w-full shimmer rounded-xl"></div>
            <div class="mt-auto pt-4 flex justify-between items-center"><div class="h-3 w-20 shimmer rounded-lg"></div><div class="h-9 w-9 rounded-full shimmer"></div></div>
        `;
        list.appendChild(skeleton);
    }
}

async function init() {
    toggleLoading(true);
    try {
        const sheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTs559uYydPkBLMcdm4iNPJTU_LFJOMLfRo35B4ft4OFIr1rsDWM3gFhV_wa5Y70Pk3oZ2-wXBZ_4s4/pub?gid=83722819&single=true&output=csv';
        const response = await fetch(`${sheetUrl}&t=${Date.now()}`);
        const csvText = await response.text();
        
        Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                data = results.data.map(row => {
                    const event = row['Choose Technical Event'] || row['Choose Art and Culture Event'] || 
                                  row['Choose Non-Technical event'] || row['Choose Sports Event'] || 'General';
                    
                    let teamName = "";
                    let members = [];
                    Object.keys(row).forEach(key => {
                        const val = row[key]?.trim();
                        if(!val) return;
                        const k = key.toLowerCase();
                        if (k.includes('team name') && !teamName) teamName = val;
                        if ((k.includes('member') || k.includes('captain') || k.includes('player')) && 
                            !k.includes('contact') && !k.includes('mobile')) {
                            if (!members.includes(val)) members.push(val);
                        }
                    });

                    return {
                        name: row['NAME'] || 'Guest',
                        college: row['SELECT YOUR COLLEGE'] || '',
                        branch: row['BRANCH'] || '',
                        category: row['EVENT CATEGORY'] || '',
                        mobile: row['MOBILE NO.'] || '',
                        event: event.trim(),
                        teamName: teamName,
                        members: members
                    };
                });
                populateFilters();
                render();
            }
        });
    } catch (err) {
        list.innerHTML = `<div class="col-span-full text-center py-10 text-red-500">Failed to connect to live sheet.</div>`;
    }
}

function populateFilters() {
    const getUnique = (key) => [...new Set(data.map(d => d[key]).filter(Boolean))].sort();
    const configs = [
        { id: 'f-college', key: 'college', label: 'Colleges' },
        { id: 'f-category', key: 'category', label: 'Categories' },
        { id: 'f-event', key: 'event', label: 'Events' }
    ];

    configs.forEach(conf => {
        const el = document.getElementById(conf.id);
        el.innerHTML = `<option value="">All ${conf.label}</option>`;
        getUnique(conf.key).forEach(val => el.add(new Option(val, val)));
        el.addEventListener('change', render);
    });
    document.getElementById('search').addEventListener('input', render);
}

function render() {
    const q = document.getElementById('search').value.toLowerCase();
    const fCol = document.getElementById('f-college').value;
    const fCat = document.getElementById('f-category').value;
    const fEvt = document.getElementById('f-event').value;

    filteredData = data.filter(d => 
        (!q || d.name.toLowerCase().includes(q) || d.teamName.toLowerCase().includes(q)) &&
        (!fCol || d.college === fCol) && (!fCat || d.category === fCat) && (!fEvt || d.event === fEvt)
    );

    countLabel.textContent = filteredData.length;
    list.innerHTML = '';
    emptyState.classList.toggle('hidden', filteredData.length > 0);

    filteredData.forEach((d, i) => {
        const div = document.createElement('div');
        div.className = 'card flex flex-col';
        div.style.animationDelay = `${i * 0.04}s`;
        
        const roster = d.members.length > 0 ? `
            <div class="mt-3 bg-slate-50 p-3 rounded-xl">
                <p class="text-[9px] font-bold text-slate-400 uppercase tracking-tight mb-1">Roster</p>
                <p class="text-[11px] text-slate-600 leading-snug">${d.members.join(', ')}</p>
            </div>` : '';

        div.innerHTML = `
            <div class="flex justify-between items-start mb-1">
                <h3 class="font-bold text-slate-900">${d.name}</h3>
                <span class="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded-md uppercase">${d.category}</span>
            </div>
            <p class="text-xs text-slate-500 mb-3">${d.college} • ${d.branch}</p>
            <div class="text-sm font-bold text-indigo-600">${d.event}</div>
            ${d.teamName ? `<div class="text-[11px] font-bold text-slate-700 italic">Team: ${d.teamName}</div>` : ''}
            ${roster}
            <div class="mt-auto pt-4 border-t border-slate-50 flex justify-between items-center">
                <span class="text-xs font-mono font-bold text-slate-400">${d.mobile}</span>
                <a href="tel:${d.mobile}" class="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md active:scale-90 transition-all">
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
    a.download = `Innovision_Data_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
}

init();