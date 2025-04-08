import React from "react";
import PrevalenceCard from "./PrevalenceCard";
import GenderDonutChart from "./gender_distribution/GenderDonutChart";
import CaseNumberCard from "./cases_number/CaseNumberCard";
import AmChartTingkatanKasus from "./CasesLevel"

const GeneralInformation = () => {
    // Sample data structure for CasesLevel component
    const casesData = {
        data: {
            "Tingkat 1": [
                { date: "2024-01", count: 10 },
                { date: "2024-02", count: 15 },
                { date: "2024-03", count: 12 }
            ],
            "Tingkat 2": [
                { date: "2024-01", count: 5 },
                { date: "2024-02", count: 8 },
                { date: "2024-03", count: 6 }
            ],
            "Tingkat 3": [
                { date: "2024-01", count: 3 },
                { date: "2024-02", count: 4 },
                { date: "2024-03", count: 2 }
            ]
        }
    };

    return (
        <div className="bg-white text-black p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold text-blue-900 mb-6">
                Informasi Kasus Penyakit Menular
            </h2>
            
            <div className="flex flex-col gap-6">
                {/* Top row with two cards side by side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Case numbers card */}
                    <CaseNumberCard
                        jumlah_kasus={100}
                        jumlah_kasus_kematian={5}
                        jumlah_kasus_sembuh={35}
                        jumlah_kasus_terjangkit={60}
                    />
                    {/* Prevalence card */}
                    <PrevalenceCard 
                        prevalenceRate={0.07315} 
                        populationYear={2024} 
                        populationCount={279390258} 
                    />
                    {/* Gender card */}
                    <GenderDonutChart
                        total={100}
                        priaValue={50}
                        wanitaValue={50}
                    /> 
                </div>                          
                {/* Bottom row with cases level chart */}
                    <AmChartTingkatanKasus jsonData={casesData} />
            </div>
        </div>
    );
};

export default GeneralInformation