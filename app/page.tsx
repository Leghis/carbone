// app/page.tsx
"use client";

import {useState, useEffect} from "react";
import {motion, AnimatePresence} from "framer-motion";
import {Card} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Slider} from "@/components/ui/slider";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {Progress} from "@/components/ui/progress";

interface TransportData {
    carType: string;
    carKm: number;
    carAge: number;
    carPassengers: number;
    publicTransportType: string;
    publicTransportKm: number;
    flightsShortHaul: number;
    flightsMediumHaul: number;
    flightsLongHaul: number;
    motorcycle: {
        owns: boolean;
        type?: string;
        km?: number;
    };
}

interface EnergyData {
    homeType: string;
    homeSize: number;
    occupants: number;
    electricityKwh: number;
    heatingType: string;
    heatingConsumption: number;
    renewableEnergy: boolean;
    renewablePercentage?: number;
    insulation: string;
}



interface LifestyleData {
    dietType: string;
    meatFrequency?: number;
    localFoodPercentage: number;
    wasteRecycling: boolean;
    wasteComposting: boolean;
    shoppingHabits: {
        clothes: number;
        electronics: number;
        furniture: number;
    };
    waterConsumption: number;
}

interface FormData {
    transport: TransportData;
    energy: EnergyData;
    lifestyle: LifestyleData;
}

interface CarbonFootprintResult {
    total: number;
    breakdown: {
        transport: number;
        energy: number;
        lifestyle: number;
    };
    comparison: {
        percentageFromNational: number;
        percentageFromWorld: number;
        nationalAverage: number;
        worldAverage: number;
    };
}

const initialFormData: FormData = {
    transport: {
        carType: "none",
        carKm: 0,
        carAge: 0,
        carPassengers: 1,
        publicTransportType: "",
        publicTransportKm: 0,
        flightsShortHaul: 0,
        flightsMediumHaul: 0,
        flightsLongHaul: 0,
        motorcycle: {
            owns: false,
        },
    },
    energy: {
        homeType: "",
        homeSize: 0,
        occupants: 1,
        electricityKwh: 0,
        heatingType: "",
        heatingConsumption: 0,
        renewableEnergy: false,
        insulation: "medium",
    },
    lifestyle: {
        dietType: "",
        localFoodPercentage: 0,
        wasteRecycling: false,
        wasteComposting: false,
        shoppingHabits: {
            clothes: 50,
            electronics: 50,
            furniture: 50,
        },
        waterConsumption: 0,
    },
};

const EMISSIONS_FACTORS = {
    car: {
        electric: 0.024, // kg CO2e/km
        hybrid: 0.089,
        petrol: 0.192,
        diesel: 0.171,
        none: 0,
    },
    flights: {
        shortHaul: 180, // kg CO2e par vol (moyenne pour un vol <1500km)
        mediumHaul: 400, // kg CO2e par vol (moyenne pour un vol 1500-3500km)
        longHaul: 1800, // kg CO2e par vol (moyenne pour un vol >3500km)
    },
    publicTransport: {
        bus: 0.089, // kg CO2e/km
        train: 0.041,
        tram: 0.035,
        subway: 0.033,
        none: 0,
    },
    diet: {
        vegan: 1000, // kg CO2e/an
        vegetarian: 1500,
        pescatarian: 1700,
        flexitarian: 2000,
        omnivore: 2500,
    },
};


const ENERGY_CONVERSION_FACTORS = {
    gas: 10.55, // kWh par m³ de gaz naturel
    oil: 10.0,  // kWh par litre de fioul
    electric: 1, // déjà en kWh
    heatPump: 1  // déjà en kWh
};

export default function CarbonCalculator() {
    const [formData, setFormData] = useState<FormData>(initialFormData);
    const [currentStep, setCurrentStep] = useState(1);
    const [subStep, setSubStep] = useState(1);
    const [showResults, setShowResults] = useState(false);
    const [progress, setProgress] = useState(0);
    const [carbonFootprint, setCarbonFootprint] = useState<CarbonFootprintResult | null>(null);


    useEffect(() => {
        const totalSteps = 3;
        const totalSubSteps = getCurrentStepMaxSubSteps();
        const progressValue =
            ((currentStep - 1) * 100 + (subStep / totalSubSteps) * 100) / totalSteps;
        setProgress(progressValue);
    }, [currentStep, subStep]);

    useEffect(() => {
        console.log('Current Step:', currentStep);
        console.log('Current SubStep:', subStep);
    }, [currentStep, subStep]);

    const getCurrentStepMaxSubSteps = () => {
        switch (currentStep) {
            case 1: // Transport
                return 3;
            case 2: // Energy
                return 3;
            case 3: // Lifestyle
                return 3;
            default:
                return 1;
        }
    };

    const calculateTransportEmissions = (transport: TransportData) => {
        let emissions = 0;

        // Émissions voiture
        if (transport.carType && transport.carType !== 'none') {
            const baseEmission = EMISSIONS_FACTORS.car[transport.carType as keyof typeof EMISSIONS_FACTORS.car];
            const ageMultiplier = 1 + (Math.min(transport.carAge, 15) * 0.02); // Max 30% d'augmentation
            const passengerDivisor = Math.max(transport.carPassengers, 1);
            emissions += (transport.carKm * baseEmission * ageMultiplier) / passengerDivisor;
        }

        // Émissions transports publics
        if (transport.publicTransportType && transport.publicTransportType !== 'none') {
            const ptEmission = EMISSIONS_FACTORS.publicTransport[
                transport.publicTransportType as keyof typeof EMISSIONS_FACTORS.publicTransport
                ];
            emissions += transport.publicTransportKm * ptEmission;
        }

        // Émissions vols
        emissions += transport.flightsShortHaul * EMISSIONS_FACTORS.flights.shortHaul;
        emissions += transport.flightsMediumHaul * EMISSIONS_FACTORS.flights.mediumHaul;
        emissions += transport.flightsLongHaul * EMISSIONS_FACTORS.flights.longHaul;

        return emissions / 1000; // Conversion en tonnes CO2e
    };


    const calculateEnergyEmissions = (energy: EnergyData) => {
        let emissions = 0;
        const baseElectricityEmission = 0.0571; // tonnes CO2e par MWh (moyenne française)
        const heatingEmissionFactors = {
            gas: 0.205,
            oil: 0.324,
            electric: 0.0571,
            heatPump: 0.019,
        };

        // Électricité
        let electricityEmissions = (energy.electricityKwh / 1000) * baseElectricityEmission;
        if (energy.renewableEnergy && energy.renewablePercentage) {
            electricityEmissions *= (1 - energy.renewablePercentage / 100);
        }

        // Conversion et calcul des émissions de chauffage
        const heatingKwh = energy.heatingConsumption *
            (ENERGY_CONVERSION_FACTORS[energy.heatingType as keyof typeof ENERGY_CONVERSION_FACTORS] || 1);

        const heatingEmissionFactor = heatingEmissionFactors[
            energy.heatingType as keyof typeof heatingEmissionFactors
            ] || heatingEmissionFactors.electric;

        const heatingEmissions = (heatingKwh / 1000) * heatingEmissionFactor;

        // Facteurs de correction
        const insulationFactors = {
            poor: 1.3,
            medium: 1,
            good: 0.8,
            excellent: 0.6,
        };
        const insulationMultiplier = insulationFactors[
            energy.insulation as keyof typeof insulationFactors
            ] || 1;

        emissions = (electricityEmissions + heatingEmissions) * insulationMultiplier;
        return emissions;
    };

    const calculateLifestyleEmissions = (lifestyle: LifestyleData) => {
        let emissions = 0;

        // Émissions alimentaires
        const dietEmission = EMISSIONS_FACTORS.diet[
            lifestyle.dietType as keyof typeof EMISSIONS_FACTORS.diet
            ] || EMISSIONS_FACTORS.diet.omnivore;

        // Ajustement nourriture locale
        const localFoodAdjustment = 1 - (lifestyle.localFoodPercentage * 0.002);
        emissions += (dietEmission * localFoodAdjustment) / 1000; // Conversion en tonnes

        // Émissions consommation
        const shoppingEmissions =
            (lifestyle.shoppingHabits.clothes * 0.1 +
                lifestyle.shoppingHabits.electronics * 0.2 +
                lifestyle.shoppingHabits.furniture * 0.15) * 0.01; // Tonnes CO2e

        emissions += shoppingEmissions;

        // Réductions recyclage et compostage
        if (lifestyle.wasteRecycling) emissions *= 0.9;
        if (lifestyle.wasteComposting) emissions *= 0.95;

        return emissions;
    };

    const getDetailedRecommendations = () => {
        const recommendations: { category: string; actions: { title: string; impact: string; description: string }[] }[] = [];

        // Recommandations transport
        const transportRecs = {
            category: "Transport",
            actions: []
        };

        if (formData.transport.carKm > 15000) {
            transportRecs.actions.push({
                title: "Réduisez vos déplacements en voiture",
                impact: "Élevé",
                description: "Essayez le covoiturage ou les transports en commun pour vos trajets réguliers. Une réduction de 20% de vos trajets en voiture pourrait économiser jusqu'à 600kg de CO2 par an."
            });
        }

        if (formData.transport.flightsLongHaul > 0) {
            transportRecs.actions.push({
                title: "Optimisez vos voyages en avion",
                impact: "Modéré",
                description: "Un vol long-courrier par an reste raisonnable. Pour réduire davantage votre impact, privilégiez le train pour les destinations accessibles et regroupez vos voyages lointains."
            });
        }

        if (formData.transport.carType === 'petrol' || formData.transport.carType === 'diesel') {
            transportRecs.actions.push({
                title: "Envisagez un véhicule plus écologique",
                impact: "Élevé",
                description: "Le passage à un véhicule hybride ou électrique pourrait réduire vos émissions de transport de 50 à 75%."
            });
        }

        if (transportRecs.actions.length > 0) {
            recommendations.push(transportRecs);
        }
        // Recommandations énergie
        const energyRecs = {
            category: "Énergie",
            actions: []
        };

        if (formData.energy.electricityKwh > 5000) {
            energyRecs.actions.push({
                title: "Optimisez votre consommation électrique",
                impact: "Élevé",
                description: "Remplacez vos appareils énergivores par des modèles A+++, utilisez des LED et éteignez les appareils en veille. Potentiel d'économie : 20-30% de votre consommation."
            });
        }

        if (!formData.energy.renewableEnergy) {
            energyRecs.actions.push({
                title: "Passez aux énergies renouvelables",
                impact: "Très élevé",
                description: "Changer pour un fournisseur d'énergie verte peut réduire l'empreinte carbone de votre consommation électrique jusqu'à 75%."
            });
        }

        if (formData.energy.insulation === 'poor' || formData.energy.insulation === 'medium') {
            energyRecs.actions.push({
                title: "Améliorez l'isolation de votre logement",
                impact: "Élevé",
                description: "Une bonne isolation peut réduire votre consommation de chauffage de 30 à 50%. Commencez par les combles et les fenêtres."
            });
        }

        if (formData.energy.heatingType === 'oil') {
            energyRecs.actions.push({
                title: "Changez votre système de chauffage",
                impact: "Très élevé",
                description: "Remplacer le chauffage au fioul par une pompe à chaleur peut réduire vos émissions de chauffage de plus de 80%."
            });
        }

        if (energyRecs.actions.length > 0) {
            recommendations.push(energyRecs);
        }

        // Recommandations mode de vie
        const lifestyleRecs = {
            category: "Mode de vie",
            actions: []
        };

        if (formData.lifestyle.dietType === 'omnivore') {
            lifestyleRecs.actions.push({
                title: "Réduisez votre consommation de viande",
                impact: "Élevé",
                description: "Devenir flexitarien en réduisant votre consommation de viande de 50% peut diminuer l'empreinte carbone de votre alimentation d'environ 30%."
            });
        }

        if (formData.lifestyle.localFoodPercentage < 30) {
            lifestyleRecs.actions.push({
                title: "Privilégiez les produits locaux et de saison",
                impact: "Modéré",
                description: "Consommer local et de saison réduit les émissions liées au transport et aux serres chauffées. Visez 50% de produits locaux."
            });
        }

        if (!formData.lifestyle.wasteRecycling || !formData.lifestyle.wasteComposting) {
            lifestyleRecs.actions.push({
                title: "Améliorez votre gestion des déchets",
                impact: "Modéré",
                description: "Le recyclage et le compostage peuvent réduire vos émissions liées aux déchets de 25%. Commencez par trier vos déchets et compostez vos déchets organiques."
            });
        }

        if (formData.lifestyle.shoppingHabits.clothes > 70 ||
            formData.lifestyle.shoppingHabits.electronics > 70) {
            lifestyleRecs.actions.push({
                title: "Adoptez une consommation plus responsable",
                impact: "Modéré",
                description: "Privilégiez les achats d'occasion, réparez vos appareils et gardez vos vêtements plus longtemps. Réduisez vos achats non essentiels de 30%."
            });
        }

        if (lifestyleRecs.actions.length > 0) {
            recommendations.push(lifestyleRecs);
        }

        return recommendations;
    };


    // Ajoutons une fonction pour comparer avec la moyenne nationale
    const compareToNationalAverage = (totalEmissions: number) => {
        const frenchAverage = 9.0; // tonnes CO2e par an et par personne en France
        const worldAverage = 4.7; // tonnes CO2e par an et par personne dans le monde

        return {
            percentageFromNational: ((totalEmissions - frenchAverage) / frenchAverage) * 100,
            percentageFromWorld: ((totalEmissions - worldAverage) / worldAverage) * 100,
            nationalAverage: frenchAverage,
            worldAverage: worldAverage
        };
    };


    const renderCurrentStep = () => {
        switch (currentStep) {
            case 1:
                return renderTransportStep();
            case 2:
                return renderEnergyStep();
            case 3:
                return renderLifestyleStep();
            default:
                return null;
        }
    };

    const renderTransportStep = () => {
        console.log('Rendering lifestyle step:', subStep);
        switch (subStep) {
            case 1:
                return (
                    <motion.div
                        initial={{opacity: 0, x: -20}}
                        animate={{opacity: 1, x: 0}}
                        exit={{opacity: 0, x: 20}}
                        className="space-y-6"
                    >
                        <h3 className="text-xl font-semibold">Votre véhicule principal</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Possédez-vous une voiture ?
                                </label>
                                <Select
                                    value={formData.transport.carType}
                                    onValueChange={(value) =>
                                        setFormData({
                                            ...formData,
                                            transport: {
                                                ...formData.transport,
                                                carType: value,
                                            },
                                        })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sélectionnez le type de véhicule"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Je n&#39;ai pas de voiture</SelectItem>
                                        <SelectItem value="electric">Électrique</SelectItem>
                                        <SelectItem value="hybrid">Hybride</SelectItem>
                                        <SelectItem value="petrol">Essence</SelectItem>
                                        <SelectItem value="diesel">Diesel</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {formData.transport.carType !== "none" && (
                                <motion.div
                                    initial={{opacity: 0, y: 10}}
                                    animate={{opacity: 1, y: 0}}
                                    className="space-y-4"
                                >
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Âge du véhicule (en années)
                                        </label>
                                        <Input
                                            type="number"
                                            min="0"
                                            max="30"
                                            value={formData.transport.carAge}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    transport: {
                                                        ...formData.transport,
                                                        carAge: Number(e.target.value),
                                                    },
                                                })
                                            }
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Kilomètres parcourus par an
                                        </label>
                                        <Input
                                            type="number"
                                            min="0"
                                            value={formData.transport.carKm}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    transport: {
                                                        ...formData.transport,
                                                        carKm: Number(e.target.value),
                                                    },
                                                })
                                            }
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Nombre moyen de passagers
                                        </label>
                                        <Select
                                            value={formData.transport.carPassengers.toString()}
                                            onValueChange={(value) =>
                                                setFormData({
                                                    ...formData,
                                                    transport: {
                                                        ...formData.transport,
                                                        carPassengers: Number(value),
                                                    },
                                                })
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Sélectionnez le nombre de passagers"/>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {[1, 2, 3, 4, 5].map((n) => (
                                                    <SelectItem key={n} value={n.toString()}>
                                                        {n} passager{n > 1 ? "s" : ""}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                );

            case 2:
                return (
                    <motion.div
                        initial={{opacity: 0, x: -20}}
                        animate={{opacity: 1, x: 0}}
                        exit={{opacity: 0, x: 20}}
                        className="space-y-6"
                    >
                        <h3 className="text-xl font-semibold">Transports en commun</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Type de transport en commun principal
                                </label>
                                <Select
                                    value={formData.transport.publicTransportType}
                                    onValueChange={(value) =>
                                        setFormData({
                                            ...formData,
                                            transport: {
                                                ...formData.transport,
                                                publicTransportType: value,
                                            },
                                        })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sélectionnez le type de transport"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Aucun</SelectItem>
                                        <SelectItem value="bus">Bus</SelectItem>
                                        <SelectItem value="train">Train</SelectItem>
                                        <SelectItem value="tram">Tramway</SelectItem>
                                        <SelectItem value="subway">Métro</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {formData.transport.publicTransportType !== "none" && (
                                <motion.div
                                    initial={{opacity: 0, y: 10}}
                                    animate={{opacity: 1, y: 0}}
                                >
                                    <label className="block text-sm font-medium mb-2">
                                        Kilomètres parcourus par an
                                    </label>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={formData.transport.publicTransportKm}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                transport: {
                                                    ...formData.transport,
                                                    publicTransportKm: Number(e.target.value),
                                                },
                                            })
                                        }
                                    />
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                );

            case 3:
                return (
                    <motion.div
                        initial={{opacity: 0, x: -20}}
                        animate={{opacity: 1, x: 0}}
                        exit={{opacity: 0, x: 20}}
                        className="space-y-6"
                    >
                        <h3 className="text-xl font-semibold">Voyages en avion</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Vols court-courriers par an ({"<"}3h)
                                </label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={formData.transport.flightsShortHaul}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            transport: {
                                                ...formData.transport,
                                                flightsShortHaul: Number(e.target.value),
                                            },
                                        })
                                    }
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Vols moyen-courriers par an (3-6h)
                                </label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={formData.transport.flightsMediumHaul}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            transport: {
                                                ...formData.transport,
                                                flightsMediumHaul: Number(e.target.value),
                                            },
                                        })
                                    }
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Vols long-courriers par an ({">"}6h)
                                </label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={formData.transport.flightsLongHaul}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            transport: {
                                                ...formData.transport,
                                                flightsLongHaul: Number(e.target.value),
                                            },
                                        })
                                    }
                                />
                            </div>
                        </div>
                    </motion.div>
                );

            default:
                console.log('No matching subStep found:', subStep);
                return null;
        }
    };

    const renderEnergyStep = () => {
        switch (subStep) {
            case 1:
                return (
                    <motion.div
                        initial={{opacity: 0, x: -20}}
                        animate={{opacity: 1, x: 0}}
                        exit={{opacity: 0, x: 20}}
                        className="space-y-6"
                    >
                        <h3 className="text-xl font-semibold">Votre logement</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Type de logement
                                </label>
                                <Select
                                    value={formData.energy.homeType}
                                    onValueChange={(value) =>
                                        setFormData({
                                            ...formData,
                                            energy: {
                                                ...formData.energy,
                                                homeType: value,
                                            },
                                        })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sélectionnez le type de logement"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="apartment">Appartement</SelectItem>
                                        <SelectItem value="house">Maison individuelle</SelectItem>
                                        <SelectItem value="studio">Studio</SelectItem>
                                        <SelectItem value="loft">Loft</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Surface habitable (m²)
                                </label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={formData.energy.homeSize}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            energy: {
                                                ...formData.energy,
                                                homeSize: Number(e.target.value),
                                            },
                                        })
                                    }
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Nombre d&#39;occupants
                                </label>
                                <Input
                                    type="number"
                                    min="1"
                                    value={formData.energy.occupants}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            energy: {
                                                ...formData.energy,
                                                occupants: Number(e.target.value),
                                            },
                                        })
                                    }
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Niveau d&#39;isolation
                                </label>
                                <Select
                                    value={formData.energy.insulation}
                                    onValueChange={(value) =>
                                        setFormData({
                                            ...formData,
                                            energy: {
                                                ...formData.energy,
                                                insulation: value,
                                            },
                                        })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sélectionnez le niveau d'isolation"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="poor">Mauvaise</SelectItem>
                                        <SelectItem value="medium">Moyenne</SelectItem>
                                        <SelectItem value="good">Bonne</SelectItem>
                                        <SelectItem value="excellent">Excellente</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </motion.div>
                );

            case 2:
                return (
                    <motion.div
                        initial={{opacity: 0, x: -20}}
                        animate={{opacity: 1, x: 0}}
                        exit={{opacity: 0, x: 20}}
                        className="space-y-6"
                    >
                        <h3 className="text-xl font-semibold">Consommation énergétique</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Consommation électrique annuelle (kWh)
                                </label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={formData.energy.electricityKwh}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            energy: {
                                                ...formData.energy,
                                                electricityKwh: Number(e.target.value),
                                            },
                                        })
                                    }
                                />
                                <p className="text-sm text-gray-500 mt-1">
                                    Vous pouvez trouver cette information sur vos factures d&#39;électricité
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Type de chauffage principal
                                </label>
                                <Select
                                    value={formData.energy.heatingType}
                                    onValueChange={(value) =>
                                        setFormData({
                                            ...formData,
                                            energy: {
                                                ...formData.energy,
                                                heatingType: value,
                                            },
                                        })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sélectionnez le type de chauffage"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="electric">Électrique</SelectItem>
                                        <SelectItem value="gas">Gaz naturel</SelectItem>
                                        <SelectItem value="oil">Fioul</SelectItem>
                                        <SelectItem value="heatPump">Pompe à chaleur</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Consommation de chauffage annuelle
                                </label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={formData.energy.heatingConsumption}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            energy: {
                                                ...formData.energy,
                                                heatingConsumption: Number(e.target.value),
                                            },
                                        })
                                    }
                                />
                                <p className="text-sm text-gray-500 mt-1">
                                    {formData.energy.heatingType === 'gas' ? 'Entrez la consommation en m³' :
                                        formData.energy.heatingType === 'oil' ? 'Entrez la consommation en litres' :
                                            'Entrez la consommation en kWh'}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                );

            case 3:
                return (
                    <motion.div
                        initial={{opacity: 0, x: -20}}
                        animate={{opacity: 1, x: 0}}
                        exit={{opacity: 0, x: 20}}
                        className="space-y-6"
                    >
                        <h3 className="text-xl font-semibold">Énergies renouvelables</h3>
                        <div className="space-y-4">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={formData.energy.renewableEnergy}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            energy: {
                                                ...formData.energy,
                                                renewableEnergy: e.target.checked,
                                            },
                                        })
                                    }
                                    className="form-checkbox"
                                />
                                <label className="text-sm font-medium">
                                    Utilisez-vous de l&#39;énergie renouvelable ?
                                </label>
                            </div>

                            {formData.energy.renewableEnergy && (
                                <motion.div
                                    initial={{opacity: 0, y: -10}}
                                    animate={{opacity: 1, y: 0}}
                                >
                                    <label className="block text-sm font-medium mb-2">
                                        Pourcentage d&#39;énergie renouvelable
                                    </label>
                                    <Slider
                                        value={[formData.energy.renewablePercentage || 0]}
                                        max={100}
                                        step={1}
                                        onValueChange={(value) =>
                                            setFormData({
                                                ...formData,
                                                energy: {
                                                    ...formData.energy,
                                                    renewablePercentage: value[0],
                                                },
                                            })
                                        }
                                    />
                                    <p className="text-sm text-gray-500 mt-1">
                                        {formData.energy.renewablePercentage}% d&#39;énergie renouvelable
                                    </p>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                );

            default:
                return null;
        }
    };

    const renderLifestyleStep = () => {
        switch (subStep) {
            case 1:
                return (
                    <motion.div
                        initial={{opacity: 0, x: -20}}
                        animate={{opacity: 1, x: 0}}
                        exit={{opacity: 0, x: 20}}
                        className="space-y-6"
                    >
                        <h3 className="text-xl font-semibold">Alimentation</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Régime alimentaire
                                </label>
                                <Select
                                    value={formData.lifestyle.dietType}
                                    onValueChange={(value) =>
                                        setFormData({
                                            ...formData,
                                            lifestyle: {
                                                ...formData.lifestyle,
                                                dietType: value,
                                            },
                                        })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sélectionnez votre régime alimentaire"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="vegan">Végan</SelectItem>
                                        <SelectItem value="vegetarian">Végétarien</SelectItem>
                                        <SelectItem value="pescatarian">Pescétarien</SelectItem>
                                        <SelectItem value="flexitarian">Flexitarien</SelectItem>
                                        <SelectItem value="omnivore">Omnivore</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {['flexitarian', 'omnivore'].includes(formData.lifestyle.dietType) && (
                                <motion.div
                                    initial={{opacity: 0, y: 10}}
                                    animate={{opacity: 1, y: 0}}
                                >
                                    <label className="block text-sm font-medium mb-2">
                                        Fréquence de consommation de viande
                                    </label>
                                    <Select
                                        value={formData.lifestyle.meatFrequency?.toString()}
                                        onValueChange={(value) =>
                                            setFormData({
                                                ...formData,
                                                lifestyle: {
                                                    ...formData.lifestyle,
                                                    meatFrequency: Number(value),
                                                },
                                            })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Sélectionnez la fréquence"/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">Rarement (1-2 fois/mois)</SelectItem>
                                            <SelectItem value="2">Occasionnellement (1-2 fois/semaine)</SelectItem>
                                            <SelectItem value="3">Régulièrement (3-4 fois/semaine)</SelectItem>
                                            <SelectItem value="4">Quotidiennement</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </motion.div>
                            )}

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Pourcentage de nourriture locale/de saison
                                </label>
                                <Slider
                                    value={[formData.lifestyle.localFoodPercentage]}
                                    max={100}
                                    step={5}
                                    onValueChange={(value) =>
                                        setFormData({
                                            ...formData,
                                            lifestyle: {
                                                ...formData.lifestyle,
                                                localFoodPercentage: value[0],
                                            },
                                        })
                                    }
                                />
                                <p className="text-sm text-gray-500 mt-1">
                                    {formData.lifestyle.localFoodPercentage}% de nourriture locale/de saison
                                </p>
                            </div>
                        </div>
                    </motion.div>
                );

            case 2:
                return (
                    <motion.div
                        initial={{opacity: 0, x: -20}}
                        animate={{opacity: 1, x: 0}}
                        exit={{opacity: 0, x: 20}}
                        className="space-y-6"
                    >
                        <h3 className="text-xl font-semibold">Consommation et déchets</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Habitudes d&#39;achat de vêtements
                                </label>
                                <Slider
                                    value={[formData.lifestyle.shoppingHabits.clothes]}
                                    max={100}
                                    step={1}
                                    onValueChange={(value) =>
                                        setFormData({
                                            ...formData,
                                            lifestyle: {
                                                ...formData.lifestyle,
                                                shoppingHabits: {
                                                    ...formData.lifestyle.shoppingHabits,
                                                    clothes: value[0],
                                                },
                                            },
                                        })
                                    }
                                />
                                <p className="text-sm text-gray-500 mt-1">
                                    {formData.lifestyle.shoppingHabits.clothes}% (0% = minimaliste, 100% = shopping
                                    fréquent)
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Achats d&#39;appareils électroniques
                                </label>
                                <Slider
                                    value={[formData.lifestyle.shoppingHabits.electronics]}
                                    max={100}
                                    step={1}
                                    onValueChange={(value) =>
                                        setFormData({
                                            ...formData,
                                            lifestyle: {
                                                ...formData.lifestyle,
                                                shoppingHabits: {
                                                    ...formData.lifestyle.shoppingHabits,
                                                    electronics: value[0],
                                                },
                                            },
                                        })
                                    }
                                />
                                <p className="text-sm text-gray-500 mt-1">
                                    {formData.lifestyle.shoppingHabits.electronics}% (0% = très peu, 100% =
                                    renouvellement fréquent)
                                </p>
                            </div>

                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={formData.lifestyle.wasteRecycling}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            lifestyle: {
                                                ...formData.lifestyle,
                                                wasteRecycling: e.target.checked,
                                            },
                                        })
                                    }
                                    className="form-checkbox"
                                />
                                <label className="text-sm font-medium">
                                    Je trie mes déchets régulièrement
                                </label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={formData.lifestyle.wasteComposting}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            lifestyle: {
                                                ...formData.lifestyle,
                                                wasteComposting: e.target.checked,
                                            },
                                        })
                                    }
                                    className="form-checkbox"
                                />
                                <label className="text-sm font-medium">
                                    Je pratique le compostage
                                </label>
                            </div>
                        </div>
                    </motion.div>
                );

            case 3:
                return (
                    <motion.div
                        initial={{opacity: 0, x: -20}}
                        animate={{opacity: 1, x: 0}}
                        exit={{opacity: 0, x: 20}}
                        className="space-y-6"
                    >
                        <h3 className="text-xl font-semibold">Consommation d&#39;eau</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Consommation d&#39;eau quotidienne estimée (litres)
                                </label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={formData.lifestyle.waterConsumption}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            lifestyle: {
                                                ...formData.lifestyle,
                                                waterConsumption: Number(e.target.value),
                                            },
                                        })
                                    }
                                />
                                <p className="text-sm text-gray-500 mt-1">
                                    La moyenne en France est d&#39;environ 150L par jour et par personne
                                </p>
                            </div>
                        </div>
                    </motion.div>
                );

            default:
                return null;
        }
    };

    const handleNext = () => {
        const maxSubSteps = getCurrentStepMaxSubSteps();
        if (subStep < maxSubSteps) {
            setSubStep(subStep + 1);
        } else if (currentStep < 3) {
            setCurrentStep(currentStep + 1);
            setSubStep(1);
        } else {
            calculateFinalFootprint();
        }
    };

    const handleBack = () => {
        if (subStep > 1) {
            setSubStep(subStep - 1);
        } else if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
            setSubStep(getCurrentStepMaxSubSteps());
        }
    };

    const calculateFinalFootprint = () => {
        const transportEmissions = calculateTransportEmissions(formData.transport);
        const energyEmissions = calculateEnergyEmissions(formData.energy);
        const lifestyleEmissions = calculateLifestyleEmissions(formData.lifestyle);

        const total = transportEmissions + energyEmissions + lifestyleEmissions;
        const comparison = compareToNationalAverage(total);

        setCarbonFootprint({
            total: total,
            breakdown: {
                transport: transportEmissions,
                energy: energyEmissions,
                lifestyle: lifestyleEmissions
            },
            comparison: comparison
        });
        setShowResults(true);
    };


    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto"
            >
                <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
                    Calculateur d&#39;Empreinte Carbone
                </h1>

                {!showResults ? (
                    <Card className="p-6 shadow-lg">
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">
                Étape {currentStep} sur 3 - {subStep}/{getCurrentStepMaxSubSteps()}
              </span>
                                <span className="text-sm font-medium text-gray-600">
                {Math.round(progress)}%
              </span>
                            </div>
                            <Progress value={progress} className="h-2" />
                        </div>

                        <AnimatePresence mode="wait">
                            <div key={`${currentStep}-${subStep}`}>
                                {renderCurrentStep()}
                            </div>
                        </AnimatePresence>

                        <div className="flex justify-between mt-8">
                            <Button
                                variant="outline"
                                onClick={handleBack}
                                disabled={currentStep === 1 && subStep === 1}
                            >
                                Retour
                            </Button>
                            <Button onClick={handleNext}>
                                {currentStep === 3 && subStep === getCurrentStepMaxSubSteps()
                                    ? "Calculer"
                                    : "Suivant"}
                            </Button>
                        </div>
                    </Card>
                ) : carbonFootprint && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-8"
                    >
                        <Card className="p-6">
                            <h2 className="text-2xl font-semibold mb-6">Résultats</h2>
                            <div className="text-center mb-8">
                                <div className="text-5xl font-bold text-green-600 mb-2">
                                    {carbonFootprint.total.toFixed(2)} tonnes CO2e/an
                                </div>
                                <div className="text-gray-600 mt-2">
                                    {carbonFootprint.comparison.percentageFromNational > 0
                                        ? `${Math.abs(Number(carbonFootprint.comparison.percentageFromNational.toFixed(1)))}% au-dessus`
                                        : `${Math.abs(Number(carbonFootprint.comparison.percentageFromNational.toFixed(1)))}% en-dessous`
                                    } de la moyenne française ({carbonFootprint.comparison.nationalAverage} tonnes)
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <h3 className="font-semibold mb-2">Transport</h3>
                                    <div className="text-2xl font-bold text-blue-600">
                                        {carbonFootprint.breakdown.transport.toFixed(2)} tonnes
                                    </div>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <h3 className="font-semibold mb-2">Énergie</h3>
                                    <div className="text-2xl font-bold text-orange-600">
                                        {carbonFootprint.breakdown.energy.toFixed(2)} tonnes
                                    </div>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <h3 className="font-semibold mb-2">Mode de vie</h3>
                                    <div className="text-2xl font-bold text-purple-600">
                                        {carbonFootprint.breakdown.lifestyle.toFixed(2)} tonnes
                                    </div>
                                </div>
                            </div>

                            <div className="mb-6">
                                <h3 className="text-xl font-semibold mb-3">
                                    Comparaison avec les moyennes
                                </h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span>Moyenne mondiale</span>
                                        <span className="font-semibold">
                    {carbonFootprint.comparison.worldAverage} tonnes/an
                  </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span>Votre empreinte vs moyenne mondiale</span>
                                        <span
                                            className={`font-semibold ${
                                                carbonFootprint.comparison.percentageFromWorld > 0
                                                    ? 'text-red-600'
                                                    : 'text-green-600'
                                            }`}
                                        >
                    {carbonFootprint.comparison.percentageFromWorld > 0 ? '+' : ''}
                                            {carbonFootprint.comparison.percentageFromWorld.toFixed(1)}%
                  </span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h3 className="text-xl font-semibold">
                                    Recommandations personnalisées
                                </h3>
                                {getDetailedRecommendations().map((category, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="space-y-4"
                                    >
                                        <h4 className="font-semibold text-lg">{category.category}</h4>
                                        <div className="space-y-3">
                                            {category.actions.map((action, actionIndex) => (
                                                <div
                                                    key={actionIndex}
                                                    className="p-4 bg-white rounded-lg shadow-sm"
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="font-medium">{action.title}</span>
                                                        <span className="text-sm px-2 py-1 bg-green-100 text-green-800 rounded">
                            Impact: {action.impact}
                          </span>
                                                    </div>
                                                    <p className="text-gray-600 text-sm">
                                                        {action.description}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            <Button
                                className="w-full mt-8"
                                onClick={() => {
                                    setShowResults(false);
                                    setCurrentStep(1);
                                    setSubStep(1);
                                    setFormData(initialFormData);
                                }}
                            >
                                Recommencer le calcul
                            </Button>
                        </Card>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
}