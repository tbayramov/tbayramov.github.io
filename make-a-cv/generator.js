var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function generateResumeHTML(resume, mode = "page", withContainer = false) {
    var html = "";
    var headline = mode === "page" ? resume["headline-info"] : resume["pdf-headline-info"];
    var topBar = headline.length === 0
        ? ""
        : headline
            .map(x => {
                console.log("> TOP BAR i", x);
                if(x[0] === "@") {
                    if(x === "@linkedin" && resume.linkedin) {
                        return `<a href="${resume.linkedin}">LinkedIn</a>`;
                    } else if(x === "@email" && resume.email) {
                        return `<a href="mailto:${resume.email}">${resume.email}</a>`;
                    } else if(x === "@location" && resume.location) {
                        return resume.location;
                    } else {
                        return "";
                    }
                }

                return x;
            })
            .filter(x => x.trim() !== "")
            .join(" | ");

    topBar = topBar.length ? "<br>" + topBar : "";

    html += `<header class="cv-heading block">
            <h1 style="margin-bottom: 0px">${resume.name}</h1>
            ${resume.title}${topBar}
         </header>`;

    if(resume["about-me"]) {
        html += makeSection("About me", makeBlock("", resume["about-me"]));
    }

    if(resume.experience.length) {
        html += makeSection("Professional experience", resume.experience.map(
            x => makeBlock(
                makeBlockHeader(x.company, x.location, formatDates(x.startDate, x.endDate)),
                x.positions.map(p => makePositionBlock(p.name, p.details)).join("")
            )).join("\n"));
    }

    if(resume["skills-categories"].length) {
        html += makeSection("Skills", makeBlock(
            "",
            resume["skills-categories"].map(x => makeSkillCategory(x.category, x.skills)).join("<br/>")))
    }

    if(resume.education.length) {
        html += makeSection("Education", resume.education
            .map(x => makeBlock(
                makeBlockHeader(x.name, x.location, formatEducationDates(x.startDate, x.endDate)),
                x.title
            )).join("\n"));
    }

    if(withContainer) {
        html = `<div class="container">
                    <div class="cv" id="cv">
                    ${html}
                    </div>
                </div>`
    };

    return html;

    function makeBlock(headerHTML, innerHTML) {
        return `<div class="block">${headerHTML}${innerHTML}</div>`
    }

    function makeBlockHeader(name, location, dates) {
        var locationContent = location ? ", " + location : "";

        return `<div class="header">
                <span><b>${name}</b>${locationContent}</span>
                <b>${dates}</b>
            </div>`
    }

    function makePositionBlock(title, details) {
        var block = `<div>
                ${title}`;

        if(details.length) {
            block += `<ul class="list">
                ${details.map(x => `<li>${x}</li>`).join("\n")}
                </ul>`;
        }

        block += "</div>";

        return block;
    }

    function makeSkillCategory(name, skills) {
        return `<b>${name}:</b> ${skills.join(", ")}`
    }

    function makeSection(title, afterHTML) {
        return `<b class="section-header">${title}</b><hr/>${afterHTML}`
    }

    function formatEducationDates(start, end) {
        if(start == null && end != null) {
            return "Class of " + end.getFullYear()
        }

        return formatDates(start, end);
    }

    function formatDates(start, end) {
        if(start == null && end == null) {
            return "[MISSING DATE RANGE]";
        }

        if(start == null) {
            return "[MISSING START DATE]"
        }

        return `${formatDate(start)}&ndash;${formatDate(end)}`;
    }

    function formatDate(date) {
        if(date == null) {
            return "present";
        }

        console.log("> ", date);

        return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`
    };
}

function renderResume(resume, mode = "page") {
    var html = generateResumeHTML(resume, mode);
    var container = document.getElementById("cv");
    container.innerHTML = html;
}

