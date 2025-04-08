import React from "react";
import PrevalenceCard from "./PrevalenceCard";


const GeneralInformation = () => {
    return (
        <div className="items-center justify-center bg-transparent text-black text-lg p-6 rounded-lg shadow-md border">
            <h2 className="text-xl font-semibold text-blue-900 mb-6">
                Informasi Kasus Penyakit Menular
            </h2>
            
            <div className="grid grid-cols-2 grid-rows-3 gap-4">
                <div >1</div>
                <div >
                <PrevalenceCard 
                prevalenceRate={0.07315} 
                populationYear={2024} 
                populationCount={279390258} 
                />
                </div>
                <div className="row-start-2">3</div>
                <div className="row-start-2">4</div>
                <div className="col-span-2 row-start-3">6</div>
            </div>
        </div>
    );
};

export default GeneralInformation

