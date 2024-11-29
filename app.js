const apiKey = "dxLwu59vwcOVbO9kKAbfiWFmG1a7xTB0d7bc0CS5";

class MediAssist {
    constructor() {
        this.symptomFiltersContainer = document.getElementById("symptom-filters");
        this.resultsContainer = document.getElementById("consultation-results");
        this.sendSymptomsBtn = document.getElementById("send-symptoms");

        this.selectedSymptoms = [];

        // List of symptoms
        this.symptomsList = [
            "high fever", "headache", "lack of appetite", "fever", "cough", "sore throat",
            "muscle aches", "fatigue", "runny nose", "sneezing", "mild fever", "dry cough",
            "shortness of breath", "loss of taste or smell", "vomiting", "thirst", "diarrhea",
            "irritability", "low blood pressure", "stomach ache", "weakness", "stomach pain"
        ];

        this.init();
    }

    init() {
        this.renderSymptomFilters();
        this.bindEvents();
    }

    renderSymptomFilters() {
        this.symptomFiltersContainer.innerHTML = "";
        this.symptomsList.forEach(symptom => {
            const filter = document.createElement("button");
            filter.className = "symptom-filter bg-gray-200 text-gray-700 px-3 py-1 rounded-full hover:bg-red-50 transition";
            filter.textContent = symptom;
            filter.addEventListener("click", () => this.toggleSymptomFilter(filter, symptom));
            this.symptomFiltersContainer.appendChild(filter);
        });
    }

    bindEvents() {
        this.sendSymptomsBtn.addEventListener("click", () => this.performSymptomConsultation());
    }

    toggleSymptomFilter(filter, symptom) {
        filter.classList.toggle("active");
        if (this.selectedSymptoms.includes(symptom)) {
            this.selectedSymptoms = this.selectedSymptoms.filter(s => s !== symptom);
        } else {
            this.selectedSymptoms.push(symptom);
        }
    }

    async performSymptomConsultation() {
        if (!this.selectedSymptoms.length) {
            this.showErrorMessage("Please select symptoms before sending.");
            return;
        }

        const prompt = `
            Based on the following symptoms: ${this.selectedSymptoms.join(", ")}, provide:
            1. A list of not more than 3 possible diseases.
            2. For each disease, include:
               - A summarized cause of the disease.
               - A short explanation of how it can be cured or managed.
            Keep the response concise.
        `;

        try {
            const response = await this.consultWithCohere(prompt);
            this.displayConsultationResults(response);
        } catch (error) {
            console.error("Error:", error);
            this.showErrorMessage("Consultation failed. Try again later.");
        }
    }

    async consultWithCohere(prompt) {
        const response = await fetch("https://api.cohere.com/v2/chat", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "command-r-plus",
                messages: [
                    { role: "system", content: "Provide concise, clear medical analysis." },
                    { role: "user", content: prompt },
                ],
            }),
        });

        if (!response.ok) throw new Error("API Error");
        return await response.json();
    }

    displayConsultationResults(response) {
        const content = response.message?.content[0]?.text || "No diagnosis available.";
        const diseases = this.parseAIResponse(content);

        this.resultsContainer.innerHTML = "";
        diseases.forEach(({ disease, cause, cure }) => {
            const card = document.createElement("div");
            card.className = "consultation-card bg-white rounded-lg p-6 shadow-md";
            card.innerHTML = `
                <h3 class="text-xl font-bold text-blue-600">${disease}</h3>
                <p class="text-gray-700 mt-2">
                    <strong>Cause:</strong> ${cause}
                </p>
                <p class="text-gray-700 mt-2">
                    <strong>Cure/Management:</strong> ${cure}
                </p>
            `;
            this.resultsContainer.appendChild(card);
        });
    }

    parseAIResponse(responseText) {
        // Parse the AI response into a structured format (example implementation).
        // Expected response format: A numbered list with disease name, cause, and cure.
        const lines = responseText.split("\n").filter(line => line.trim());
        const diseases = [];
        let currentDisease = {};

        lines.forEach(line => {
            if (/^\d+\./.test(line)) {
                // New disease entry
                if (Object.keys(currentDisease).length > 0) {
                    diseases.push(currentDisease);
                }
                currentDisease = { disease: line.replace(/^\d+\.\s*/, "").trim(), cause: "", cure: "" };
            } else if (line.toLowerCase().includes("cause:")) {
                currentDisease.cause = line.replace(/cause:/i, "").trim();
            } else if (line.toLowerCase().includes("cure:")) {
                currentDisease.cure = line.replace(/cure:/i, "").trim();
            }
        });

        if (Object.keys(currentDisease).length > 0) {
            diseases.push(currentDisease);
        }

        return diseases;
    }

    showErrorMessage(message) {
        this.showMessage(message, "text-red-600");
    }

    showMessage(message, colorClass) {
        const messageEl = document.createElement("div");
        messageEl.className = `p-4 rounded-lg text-center font-semibold ${colorClass}`;
        messageEl.textContent = message;

        this.resultsContainer.innerHTML = "";
        this.resultsContainer.appendChild(messageEl);
    }
}

document.addEventListener("DOMContentLoaded", () => new MediAssist());