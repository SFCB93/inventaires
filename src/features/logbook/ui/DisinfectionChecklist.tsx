import type { DisinfectionProtocol } from '../domain/types'

interface ChecklistContent {
  title: string
  steps: string[]
}

const CONTENT: Record<DisinfectionProtocol, ChecklistContent> = {
  periodique: {
    title: 'Désinfection périodique',
    steps: [
      "Aérer le véhicule (portes ouvertes)",
      "Se laver les mains",
      "Mettre des gants à usage unique non stériles et des lunettes de protection",
      "Dépoussiérer et nettoyer le sol et l'intérieur du véhicule",
      "Cellule sanitaire : ôter le matériel encombrant les surfaces",
      "Nettoyer et désinfecter toutes les surfaces sauf le sol (lingette à usage unique, technique des 2 seaux ci-dessous)",
      "Laisser sécher sans rincer",
      "Réintégrer le matériel nettoyé et désinfecté",
      "Nettoyer et désinfecter le sol en terminant par lui (technique des 2 seaux + balai à franges)",
      "Laisser sécher avant de pénétrer dans la cellule",
      "Cabine de conduite : nettoyer au pulvérisateur tableau de bord, volant, levier de vitesse, manettes, frein à main, poignées de portes, appareils de communication",
      "Étaler avec une lavette à usage unique, laisser sécher, ne pas rincer",
      "Laver le sol de la cabine de l'intérieur vers l'extérieur",
      "Jeter le matériel à usage unique et les gants dans le sac DASRI (jaune)",
      "Se laver les mains",
    ],
  },
  approfondie: {
    title: 'Désinfection approfondie',
    steps: [
      "Aérer le véhicule (portes ouvertes)",
      "Se laver les mains",
      "Mettre des gants à usage unique non stériles et des lunettes de protection",
      "Dépoussiérer et nettoyer le sol et l'intérieur du véhicule",
      "Cellule sanitaire : sortir tout le matériel et le déposer sur un plan de travail réservé au matériel non désinfecté",
      "Nettoyer et désinfecter toutes les surfaces sauf le sol, en commençant par le plafond puis les parois, sans oublier tiroirs et placards, en insistant sur le support de brancard (technique des 2 seaux ci-dessous)",
      "Laisser sécher sans rincer",
      "Nettoyer et désinfecter le matériel sorti de la cellule",
      "Réintégrer l'ensemble du matériel nettoyé et désinfecté en vérifiant son état de fonctionnement",
      "Nettoyer et désinfecter le sol en terminant par lui (technique des 2 seaux + balai à franges)",
      "Laisser sécher avant de pénétrer dans la cellule",
      "Cabine de conduite : nettoyer au pulvérisateur tableau de bord, volant, levier de vitesse, manettes, frein à main, poignées de portes, appareils de communication",
      "Étaler avec une lavette à usage unique, laisser sécher, ne pas rincer",
      "Laver le sol de la cabine de l'intérieur vers l'extérieur",
      "Jeter le matériel à usage unique et les gants dans le sac DASRI (jaune)",
      "Se laver les mains",
    ],
  },
}

const BUCKET_REMINDER_STEPS = [
  "Préparer le seau rouge (lavage) avec la solution détergente-désinfectante diluée selon les indications du fournisseur.",
  "Remplir le seau bleu (rinçage) avec de l'eau claire.",
  "Tremper la frange dans le seau rouge.",
  "Laver le sol en partant du fond vers l'extérieur, en faisant des « S ».",
  "Essorer la frange dans le seau bleu.",
  "Répéter (tremper rouge → laver → essorer bleu) autant que nécessaire.",
  "Changer l'eau du seau bleu dès qu'elle devient trouble.",
  "À la fin : vider et rincer les deux seaux, laver la frange (en machine si besoin, séparément du linge) et laisser sécher le tout.",
]

interface DisinfectionChecklistProps {
  protocol: DisinfectionProtocol
}

// Contenu statique (pas de donnée Firestore), extrait de la fiche PSE 04FT05 (09-2014). Purement indicatif.
export function DisinfectionChecklist({ protocol }: DisinfectionChecklistProps) {
  const content = CONTENT[protocol]

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 p-4" data-testid="disinfection-steps">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Conduite à tenir</h3>
        <ol className="space-y-2 list-decimal list-inside">
          {content.steps.map((step, index) => (
            <li key={index} className="text-sm text-slate-700 leading-snug">{step}</li>
          ))}
        </ol>
      </div>

      <div className="rounded-xl bg-blue-50 border border-blue-100 p-4" data-testid="disinfection-bucket-reminder">
        <h3 className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-3">Technique des 2 seaux</h3>
        <ol className="space-y-1.5 list-decimal list-inside">
          {BUCKET_REMINDER_STEPS.map((step, index) => (
            <li key={index} className="text-sm text-blue-900 leading-snug">{step}</li>
          ))}
        </ol>
      </div>
    </div>
  )
}
