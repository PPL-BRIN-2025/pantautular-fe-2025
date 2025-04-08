import React from "react";
import PrevalenceCard from "./PrevalenceCard";
import GenderDonutChart from "./gender_distribution/GenderDonutChart";
import CaseNumberCard from "./cases_number/CaseNumberCard";
const GeneralInformation = () => {
    return (
        <div className="items-center justify-center bg-transparent text-black text-lg p-6 rounded-lg shadow-md border">
            <h2 className="text-xl font-semibold text-blue-900 mb-6">
                Informasi Kasus Penyakit Menular
            </h2>
            
            <div className="grid grid-cols-2 grid-rows-3 gap-4">
                <CaseNumberCard
                jumlah_kasus={100}
                jumlah_kasus_kematian={5}
                jumlah_kasus_sembuh={35}
                jumlah_kasus_terjangkit={60}
                />
                <PrevalenceCard 
                prevalenceRate={0.07315} 
                populationYear={2024} 
                populationCount={279390258} 
                />
                <GenderDonutChart
                total={100}
                priaValue={50}
                wanitaValue={50}
                />
            </div>
        </div>
    );
};

export default GeneralInformation