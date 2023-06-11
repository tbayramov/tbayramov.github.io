var currentResume = {};
var changed = false;
var changedAt = Date.now();

const DEFAULT_DETAILS_FORMAT = "@email | @linkedin | @location";
const EXAMPLE_RESUME = {"name":"John Doe","title":"Senior Software Engineer","location":"Redmond, WA","email":"john-doe@themail.web","linkedin":"#","headline-info":["@email","@linkedin","@location","<a href=\"johnd.oe\">Website</a>"],"about-me":"Hi! I'm a senior software engineer based who goes by the name JD. My focus is on operating systems development and design. I like to be an example for all CV makers out there.","experience":[{"company":"ACME Solutions","location":"Redmond, WA","startDate":"2022-05-23T00:00:00.000Z","endDate":null,"positions":[{"name":"Senior Software Engineer","details":["Perform extensive code reviews and assist developers in implementing robust solutions","Develop new features and support existing codebase","Guide and mentor junior developers"]}]},{"company":"Consultant","location":"Remote","startDate":"2010-07-01T00:00:00.000Z","endDate":"2022-04-01T00:00:00.000Z","positions":[{"name":"Software Development Engineer","details":["Designed and developed RESTful APIs using Node.js and RabbitMQ","Supported existing codebase","Started projects from scratch"]}]}],"skills-categories":[{"category":"Development","skills":["Java","C#","Shell","PowerShell","TypeScript","Node.js","Go","Rust","React","Angular"]},{"category":"Languages","skills":["English (native)","Spanish (C1)","German (B2)"]}],"education":[{"name":"Redmond Public College","location":"Redmond, WA","startDate":null,"endDate":"2010-05-01T00:00:00.000Z","title":" Bachelor of Computer Science"}]};

const getExportFilename = (name, date) => `${name ? name : "CV"}-${MONTHS[date.getMonth()]}-${date.getDate()}-${date.getFullYear()}.json`;



const setOnClick = (elementId, f) => document.getElementById(elementId).onclick = f;
const setOnClickAll = (elementsClass, f) => {
    var elements = document.getElementsByClassName(elementsClass);

    for(const el of elements) {
        el.onclick = f;
    }
}

function initializeActions() {
    setChangedOnInput(document.getElementById("editor"));

    document.getElementById("editor-details-format").value = DEFAULT_DETAILS_FORMAT;
    document.getElementById("autosave-date").innerHTML = new Date(changedAt).toLocaleString();

    setInterval(() => {
        if(changed) {
            collectResume();
            renderResume(currentResume);
            persist();

            changed = false;
            document.getElementById("autosave-date").innerHTML = new Date(changedAt).toLocaleString();
        }
    }, 500);

    setOnClick("import-example-cv", (e) => {
        if(confirm("You will lose any existing progress. Proceed?")) {
            load(EXAMPLE_RESUME);
        }
    });

    setOnClickAll("button-minimize-fieldset", minimize(false));
    setOnClick("add-experience", function(e) {
        e.preventDefault();
        addExperience(null, e.target);
    })

    setOnClick("add-skills-category", function(e) {
        e.preventDefault();
        addSkillsCategory(null, e.target);
    });

    setOnClick("add-education", function(e) {
        e.preventDefault();
        addEducation(null, e.target);
    });

    setOnClick("hide-editor", function(e) {
        e.preventDefault();
        document.querySelector(".editor-form").classList.add("hidden");
        document.querySelector(".editor-about").classList.add("hidden");
        document.querySelector("#show-editor").classList.remove("hidden");
    });

    setOnClick("show-editor", function(e) {
        e.preventDefault();
        document.querySelector(".editor-form").classList.remove("hidden");
        document.querySelector(".editor-about").classList.remove("hidden");
        document.querySelector("#show-editor").classList.add("hidden");
    });

    setOnClick("refresh-preview", function(e) {
        e.preventDefault();

        collectResume();
        renderResume(currentResume);
        persist();
    });

    window.addEventListener("beforeprint", (e) => {
        collectResume();
        document.querySelector(".editor-container").classList.add("hidden");
        document.querySelector(".container").classList.add("print-sized-font");
        renderResume(currentResume, "print");
    });
    window.addEventListener("afterprint", (e) => {
        document.querySelector(".editor-container").classList.remove("hidden");
        document.querySelector(".container").classList.remove("print-sized-font");
        renderResume(currentResume);
    });
    setOnClick("print", function(e) {
        e.preventDefault();
        window.print();
    });

    setOnClick("save-json", function(e) {
        e.preventDefault();

        var filename = getExportFilename(currentResume.name, new Date());
        exportJson(localStorage.getItem("resume"), filename, "json");
    });

    setOnClick("clear", function(e) {
        e.preventDefault();
        if(confirm("This will remove current resume. This action is irreversible. Proceed?")) {
            clear();
        }
    })

    document.getElementById('json-selector').addEventListener('change', (event) => {
        if(!confirm("You will lose any existing progress. Proceed?")) {
            return;
        }

        const fileList = event.target.files;
        if(!fileList.length || fileList[0].type && fileList[0].type.indexOf('json') === -1) {
            alert("This is not JSON");
            return;
        }

        var reader = new FileReader();
        reader.addEventListener('load', (event) => load(JSON.parse(event.target.result)));
        reader.readAsText(fileList[0]);
    });

    load();
}

function collectResume () {
    var headline = document.getElementById("editor-details-format").value
        .split("|")
        .map(x => x.trim())
        .filter(x => x != '');

    currentResume = {
        name: document.querySelector("#editor [name=name]").value,
        title: document.querySelector("#editor [name=title]").value,
        location:  document.querySelector("#editor [name=location]").value,
        email:  document.querySelector("#editor [name=email]").value,
        linkedin:  document.querySelector("#editor [name=linkedin]").value,
        "headline-info": headline,
        "about-me": document.querySelector("#editor [name=about-me]").value,

        experience: getProfessionalExperience().sort((a, b) => dateComparer(a.startDate, b.startDate)),
        "skills-categories": getSkillsCategories(),
        education: getEducation().sort((a, b) => dateComparer(a.endDate, b.endDate))
    };
}

function dateComparer(a, b) {
    return a < b ? 1 : a > b ? -1 : 0;
}

function remove(e) {
    e.preventDefault();
    var parent = e.target.parentElement;
    console.log(parent);
    while(parent.tagName.toLowerCase() !== e.target.dataset.remove.toLowerCase()) {
        parent = parent.parentElement;
        console.log(parent.tagName);
    }

    parent.remove();
}

function minimize(shouldUpdateTitle) {
    return function(e) {
        e.preventDefault();
        var parent = e.target.parentElement;
        while(parent.tagName.toLowerCase() !== "fieldset") {
            parent = parent.parentElement;
        }

        var content = parent.getElementsByClassName(`fieldset-content`)[0];
        var title = parent.querySelector("legend span.window-controls-title");
        var titleValue = parent.querySelector("input[name=name]")?.value;

        if(content.classList.contains("hidden")) {
            e.target.innerHTML = "&ndash;";

            if(shouldUpdateTitle) {
                title.innerHTML = "";
                title.classList.add("hidden");
            }
        } else {
            e.target.innerHTML = "+";

            if(shouldUpdateTitle) {
                title.innerHTML = titleValue;
                if(title.innerHTML.trim() === "") {
                    title.innerHTML = "[unknown]";
                }

                title.classList.remove("hidden");
            }
        }

        content.classList.toggle("hidden");
    }
}

function setChanged() {
    changed = true;
    changedAt = Date.now();
}

function persist() {
    localStorage.setItem("resume", JSON.stringify(currentResume));
}

function load(resume = null) {
    if(resume == null) {
        var persisted = localStorage.getItem("resume");
        if(!persisted) {
            return;
        }

        resume = JSON.parse(persisted);
    }

    clear();

    for(const experience of resume.experience) {
        addExperience(experience);
    }

    for(const category of resume["skills-categories"]) {
        addSkillsCategory(category);
    }

    for(const education of resume.education) {
        addEducation(education);
    }

    document.getElementById("editor-name").value = resume.name;
    document.getElementById("editor-title").value = resume.title;
    document.getElementById("editor-about-me").value = resume["about-me"];
    document.getElementById("editor-location").value = resume.location;
    document.getElementById("editor-email").value = resume.email;
    document.getElementById("editor-linkedin").value = resume.linkedin;
    document.getElementById("editor-details-format").value = resume["headline-info"].join(" | ");

    collectResume();
    renderResume(currentResume);
    persist();
}

function clear() {
    var experience = document.querySelectorAll(".prof-experience:not(#prof-experience-template)");
    for(const x of experience) x.remove();

    var skills = document.querySelectorAll(".skills-category:not(#skills-category-template)");
    for(const x of skills) x.remove();

    var education = document.querySelectorAll(".education:not(#education-template)");
    for(const x of education) x.remove();

    document.getElementById("editor-name").value = "";
    document.getElementById("editor-title").value = "";
    document.getElementById("editor-about-me").value = "";

    document.getElementById("editor-location").value = "";
    document.getElementById("editor-email").value = "";
    document.getElementById("editor-linkedin").value = "";
    document.getElementById("editor-details-format").value = DEFAULT_DETAILS_FORMAT;

    localStorage.removeItem("resume");

    collectResume();
    renderResume(currentResume);
    persist();
}

function setChangedOnInput(node) {
    node.querySelectorAll(`input, textarea`).forEach(x => x.oninput = setChanged);
}

function makeInstance(componentName) {
    var template = document.getElementById(`${componentName}-template`);
    var clone = template.cloneNode(true);
    clone.id = "";

    clone.style = "";
    clone.dataset.index = `${document.getElementsByClassName(componentName).length}`;

    return clone;
}


function addExperience(prefill = null, addBefore = null) {
    var node = makeExperience(prefill);

    if(addBefore === null) {
        addBefore = document.querySelector("#add-experience");
    }

    addBefore.parentNode.insertBefore(node, addBefore);

    if(prefill !== null && prefill.positions?.length) {
        for(const position of prefill.positions) {
            addExperiencePosition(node, position);
        }
    }
}

function makeExperience(prefill = null) {
    var node = makeInstance("prof-experience");
    node.querySelector(`button.remove-experience`).onclick = remove;
    node.querySelector(`button.button-minimize-fieldset`).onclick = minimize(true);
    node.querySelector(`button.add-position`).onclick = (e) => {
        e.preventDefault();
        addExperiencePosition(node);
    }

    if(prefill !== null) {
        node.querySelector(`input[name=name]`).value = prefill.company;
        node.querySelector(`input[name=start-date]`).valueAsDate = new Date(Date.parse(prefill.startDate));
        node.querySelector(`input[name=end-date]`).valueAsDate = new Date(Date.parse(prefill.endDate));
        node.querySelector(`input[name=location]`).value = prefill.location;
    }

    setChangedOnInput(node);

    return node;
}


function addExperiencePosition(experience, prefill = null) {
    var node = makeExperiencePosition(experience, prefill);

    const addBefore = experience.querySelector(".add-position");

    addBefore.parentNode.insertBefore(node, addBefore);
}

function makeExperiencePosition(experience, prefill = null) {
    var node = makeInstance("prof-position")
    node.dataset.index = `${experience.getElementsByClassName("prof-position").length}`;

    node.querySelector(`button.window-control-close`).onclick = remove;
    node.querySelector(`button.button-minimize-fieldset`).onclick = minimize(true);

    if(prefill !== null) {
        node.querySelector(`input[name=name]`).value = prefill.name;
        node.querySelector(`textarea[name=details]`).innerHTML = prefill.details.join("\n");
    }

    setChangedOnInput(node);

    return node;
}


function addSkillsCategory(prefill = null, addBefore = null) {
    var node = makeSkillsCategory(prefill);

    if(addBefore === null) {
        addBefore = document.querySelector("#add-skills-category");
    }

    addBefore.parentNode.insertBefore(node, addBefore);
}

function makeSkillsCategory(prefill = null) {
    var node = makeInstance("skills-category");
    node.querySelector(`button.remove-skills-category`).onclick = remove;
    node.querySelector(`button.button-minimize-fieldset`).onclick = minimize(true);

    if(prefill !== null) {
        node.querySelector("input[name=name]").value = prefill.category;
        node.querySelector("input[name=skills]").value = prefill.skills.join(", ");
    }

    setChangedOnInput(node);

    return node;
}


function addEducation(prefill = null, addBefore = null) {
    var node = makeEducation(prefill);

    if(addBefore === null) {
        addBefore = document.querySelector("#add-education");
    }

    addBefore.parentNode.insertBefore(node, addBefore);
}

function makeEducation(prefill = null) {
    var node = makeInstance("education");
    node.querySelector(`button.remove-education`).onclick = remove;
    node.querySelector(`button.button-minimize-fieldset`).onclick = minimize(true);

    if(prefill !== null) {
        node.querySelector(`input[name=name]`).value = prefill.name;
        node.querySelector(`input[name=start-date]`).valueAsDate = new Date(Date.parse(prefill.startDate));
        node.querySelector(`input[name=end-date]`).valueAsDate = new Date(Date.parse(prefill.endDate));
        node.querySelector(`input[name=location]`).value = prefill.location;
        node.querySelector(`input[name=title]`).value = prefill.title;
    }

    setChangedOnInput(node);

    return node;
}


function getProfessionalExperience() {
    var divs = Array.from(document.querySelectorAll("#editor .prof-experience:not(#prof-experience-template)"));
    return divs.map(d => ({
            company: d.querySelector("[name=name]").value,
            location: d.querySelector("[name=location]").value,
            startDate: d.querySelector("[name=start-date]").valueAsDate,
            endDate: d.querySelector("[name=end-date]").valueAsDate,
            positions: getPositions(d)
        }));
}

function getPositions(work) {
    var positions = Array.from(work.querySelectorAll(".prof-position:not(#prof-position-template)"));

    return positions.map(p => ({
        name: p.querySelector("[name=name]").value,
        details: p.querySelector("[name=details]").value.split('\n').filter(s => s.trim() !== "")
    }));
}

function getSkillsCategories() {
    var divs = Array.from(document.querySelectorAll("#editor .skills-category:not(#skills-category-template)"));

    return divs
        .map(d => ({
            category: d.querySelector("[name=name]").value,
            skills: d.querySelector("[name=skills]").value.split(",").map(s => s.trim()),
        }))
}

function getEducation() {
    var divs = Array.from(document.querySelectorAll("#editor .education:not(#education-template)"));
    return divs.map(d => ({
            name: d.querySelector("[name=name]").value,
            location: d.querySelector("[name=location]").value,
            startDate: d.querySelector("[name=start-date]").valueAsDate,
            endDate: d.querySelector("[name=end-date]").valueAsDate,
            title: d.querySelector("[name=title]").value,
        }));
}

function exportJson(data, filename, type) {
    var file = new Blob([data], {type: type});
    if (window.navigator.msSaveOrOpenBlob) // IE10+
        window.navigator.msSaveOrOpenBlob(file, filename);
    else { // Others
        var a = document.createElement("a"),
            url = URL.createObjectURL(file);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function() {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 0);
    }
}