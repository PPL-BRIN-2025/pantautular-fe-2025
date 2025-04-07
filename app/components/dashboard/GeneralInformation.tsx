import React from "react";
import GenderDonutChart from "./gender_distribution/GenderDonutChart";
import CaseNumberCard from "./cases_number/CaseNumberCard";
const GeneralInformation = () => {
    return (
        <div className="flex justify-center bg-transparent text-black text-lg pt-6 rounded-lg shadow-md border flex-col items-start gap-3">
            <p className="ml-6">Informasi Kasus Penyakit Menular</p>
            <div className="flex justify-end items-stretch w-full gap-6">
                <CaseNumberCard
                jumlah_kasus={100}
                jumlah_kasus_kematian={5}
                jumlah_kasus_sembuh={35}
                jumlah_kasus_terjangkit={60}
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

