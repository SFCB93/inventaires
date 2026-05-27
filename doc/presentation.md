---
theme: default
title: Gestion du matériel — Sécourisme
author: Documentation interne · 2026
canvasWidth: 1280
colorSchema: light
transition: fade
---

<!-- SLIDE 1 — COVER -->

<div class="full-slide s1">
  <div class="s1-deco"></div>
  <div class="s1-deco2"></div>
  <div class="s1-eyebrow">Documentation interne · 2026</div>
  <div class="s1-title">Gestion du matériel<br>de secourisme</div>
  <div class="s1-sub">Application web de contrôle d'inventaire pour associations de secourisme — frontoffice public et backoffice sécurisé.</div>
  <div class="s1-tags">
    <span class="s1-tag">Next.js 15</span>
    <span class="s1-tag">Firebase</span>
    <span class="s1-tag">Resend</span>
    <span class="s1-tag">Mobile-first</span>
  </div>
</div>

---

<!-- SLIDE 2 — VUE D'ENSEMBLE -->

<div class="slide-col full-slide" style="background:white;">
  <div class="slide-header">
    <div class="slide-eyebrow">Architecture</div>
    <div class="slide-title">Deux espaces distincts</div>
    <div class="slide-desc">Le frontoffice est entièrement public, accessible via QR code. Le backoffice est réservé aux responsables authentifiés.</div>
  </div>
  <div class="content" style="align-items:stretch;">
    <div class="overview-grid">
      <div class="ov-card" style="background:#eff6ff;border:1px solid #bfdbfe;">
        <div class="ov-card-title" style="color:#1d4ed8;">📱 Frontoffice — public</div>
        <div class="ov-step"><div class="ov-num" style="background:#2563eb;color:white;">1</div>Le secouriste scanne le QR code de l'inventaire</div>
        <div class="ov-step"><div class="ov-num" style="background:#2563eb;color:white;">2</div>Il vérifie chaque matériel emplacement par emplacement</div>
        <div class="ov-step"><div class="ov-num" style="background:#2563eb;color:white;">3</div>Il signale les anomalies avec un commentaire obligatoire</div>
        <div class="ov-step"><div class="ov-num" style="background:#2563eb;color:white;">4</div>Il soumet le contrôle avec son nom</div>
        <div class="ov-step" style="border:none;"><div class="ov-num" style="background:#2563eb;color:white;">5</div>Un mail est envoyé aux responsables</div>
      </div>
      <div class="ov-card" style="background:#f0fdf4;border:1px solid #bbf7d0;">
        <div class="ov-card-title" style="color:#15803d;">🖥️ Backoffice — authentifié</div>
        <div class="ov-step"><div class="ov-num" style="background:#16a34a;color:white;">→</div>Gestion des inventaires, emplacements, matériels</div>
        <div class="ov-step"><div class="ov-num" style="background:#16a34a;color:white;">→</div>Génération de QR codes par inventaire</div>
        <div class="ov-step"><div class="ov-num" style="background:#16a34a;color:white;">→</div>Tableau de bord des contrôles reçus</div>
        <div class="ov-step"><div class="ov-num" style="background:#16a34a;color:white;">→</div>Suivi et correction des péremptions</div>
        <div class="ov-step" style="border:none;"><div class="ov-num" style="background:#16a34a;color:white;">→</div>Paramètres : nom, emails de notification</div>
      </div>
      <div class="ov-card" style="background:#fdf4ff;border:1px solid #e9d5ff;">
        <div class="ov-card-title" style="color:#7e22ce;">🔑 Authentification</div>
        <div class="ov-step"><div class="ov-num" style="background:#7c3aed;color:white;">→</div>Firebase Auth — cookie de session sécurisé</div>
        <div class="ov-step"><div class="ov-num" style="background:#7c3aed;color:white;">→</div>Middleware Next.js protège le groupe de routes</div>
        <div class="ov-step" style="border:none;"><div class="ov-num" style="background:#7c3aed;color:white;">→</div>Superadmin peut administrer toutes les associations</div>
      </div>
      <div class="ov-card" style="background:#fff7ed;border:1px solid #fed7aa;">
        <div class="ov-card-title" style="color:#c2410c;">📧 Notifications</div>
        <div class="ov-step"><div class="ov-num" style="background:#ea580c;color:white;">→</div>Mail envoyé à chaque contrôle soumis (Resend)</div>
        <div class="ov-step"><div class="ov-num" style="background:#ea580c;color:white;">→</div>Résumé : anomalies + dates de péremption saisies</div>
        <div class="ov-step" style="border:none;"><div class="ov-num" style="background:#ea580c;color:white;">→</div>Destinataires configurables par l'association</div>
      </div>
    </div>
  </div>
</div>

---

<!-- SLIDE 3 — FRONTOFFICE WELCOME -->

<div class="slide-col full-slide" style="background:white;">
  <div class="slide-header">
    <div class="slide-eyebrow">Frontoffice · Étape 1</div>
    <div class="slide-title">Accueil de l'inventaire</div>
    <div class="slide-desc">Le secouriste scanne le QR code collé sur le véhicule ou le sac. Il voit immédiatement le nombre d'emplacements et de matériels à vérifier.</div>
  </div>
  <div class="content" style="align-items:center;gap:60px;">
    <div class="phone">
      <div class="phone-screen" style="display:flex;flex-direction:column;">
        <div class="ms-welcome-header">
          <div class="ms-welcome-eyebrow">Contrôle d'inventaire</div>
          <div class="ms-welcome-title">VSL 42 — Véhicule</div>
        </div>
        <div class="ms-stats">
          <div class="ms-stat"><div class="ms-stat-num">4</div><div class="ms-stat-label">emplacements</div></div>
          <div class="ms-stat"><div class="ms-stat-num">23</div><div class="ms-stat-label">matériels</div></div>
        </div>
        <div class="ms-hint">Vérifiez chaque matériel emplacement par emplacement.</div>
        <div style="flex:1;"></div>
        <div class="ms-btn">Commencer le contrôle</div>
      </div>
    </div>
    <div class="features">
      <div class="feat">
        <div class="feat-icon" style="background:#eff6ff;">📱</div>
        <div><div class="feat-title">Accès direct par QR code</div><div class="feat-body">Chaque inventaire a une URL unique encodée dans un QR code imprimable.</div></div>
      </div>
      <div class="feat">
        <div class="feat-icon" style="background:#f0fdf4;">📊</div>
        <div><div class="feat-title">Vue d'ensemble immédiate</div><div class="feat-body">Nombre d'emplacements et de matériels à contrôler affichés dès l'entrée.</div></div>
      </div>
      <div class="feat">
        <div class="feat-icon" style="background:#fdf4ff;">🚀</div>
        <div><div class="feat-title">Aucun compte nécessaire</div><div class="feat-body">Le frontoffice est entièrement public. Pas d'inscription, pas de téléchargement.</div></div>
      </div>
    </div>
  </div>
</div>

---

<!-- SLIDE 4 — VÉRIFICATION MATÉRIEL -->

<div class="slide-col full-slide" style="background:white;">
  <div class="slide-header">
    <div class="slide-eyebrow">Frontoffice · Étape 2</div>
    <div class="slide-title">Vérification matériel par matériel</div>
    <div class="slide-desc">L'interface guide le secouriste emplacement par emplacement. Chaque matériel est présenté avec sa photo et son nom.</div>
  </div>
  <div class="content" style="align-items:center;gap:60px;">
    <div class="phone">
      <div class="phone-screen" style="display:flex;flex-direction:column;">
        <div class="ms-progress"><div class="ms-progress-fill"></div></div>
        <div style="font-size:8px;color:#94a3b8;padding:0 16px 8px;display:flex;justify-content:space-between;">
          <span>Poche avant</span><span>Matériel 2 / 5</span>
        </div>
        <div class="ms-photo"><div class="ms-photo-icon">💊</div></div>
        <div class="ms-item-body">
          <div class="ms-item-name">SHA 100 ml</div>
          <div class="ms-date-label">📅 Date de péremption <span style="background:#fee2e2;color:#dc2626;font-size:8px;padding:1px 4px;border-radius:4px;font-weight:700;">obligatoire</span></div>
          <div class="ms-date-input">jj/mm/aaaa</div>
        </div>
        <div style="flex:1;"></div>
        <div class="ms-decisions">
          <div class="ms-btn-present">✓ Présent</div>
          <div class="ms-btn-anomaly">⚠ Anomalie</div>
        </div>
      </div>
    </div>
    <div class="features">
      <div class="feat">
        <div class="feat-icon" style="background:#f0fdf4;">✓</div>
        <div><div class="feat-title">Deux boutons larges</div><div class="feat-body">Interface optimisée mobile : ✓ Présent ou ⚠ Anomalie. Swipe gauche/droite en complément.</div></div>
      </div>
      <div class="feat">
        <div class="feat-icon" style="background:#eff6ff;">📸</div>
        <div><div class="feat-title">Photo par matériel</div><div class="feat-body">Chaque item peut avoir une photo pour aider le secouriste à l'identifier visuellement.</div></div>
      </div>
      <div class="feat">
        <div class="feat-icon" style="background:#fff7ed;">📅</div>
        <div><div class="feat-title">Saisie des dates de péremption</div><div class="feat-body">Champ facultatif ou obligatoire (matériels critiques). Alertes automatiques à J‑30.</div></div>
      </div>
    </div>
  </div>
</div>

---

<!-- SLIDE 5 — ANOMALIE -->

<div class="slide-col full-slide" style="background:white;">
  <div class="slide-header">
    <div class="slide-eyebrow">Frontoffice · Anomalie</div>
    <div class="slide-title">Signalement d'une anomalie</div>
    <div class="slide-desc">Quand le secouriste appuie sur ⚠ Anomalie, une popup s'affiche. Un commentaire est obligatoire — la fermeture est bloquée si le champ est vide.</div>
  </div>
  <div class="content" style="align-items:center;gap:60px;">
    <div class="phone">
      <div class="phone-screen" style="display:flex;flex-direction:column;background:#1e293b;">
        <div style="flex:1;display:flex;align-items:flex-end;">
          <div style="width:100%;">
            <div class="ms-modal" style="border-radius:20px 20px 0 0;">
              <div class="ms-drag"></div>
              <div class="ms-modal-title">⚠ Décrire l'anomalie</div>
              <div style="font-size:9px;color:#64748b;margin-bottom:4px;">Commentaire <span style="color:#dc2626;">*</span></div>
              <textarea class="ms-textarea" placeholder="Ex. : produit périmé, quantité insuffisante, emballage endommagé…"></textarea>
              <div class="ms-modal-actions">
                <div class="ms-modal-confirm">Confirmer l'anomalie</div>
                <div class="ms-modal-cancel">Annuler</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="features">
      <div class="feat">
        <div class="feat-icon" style="background:#fffbeb;">⚠</div>
        <div><div class="feat-title">Commentaire obligatoire</div><div class="feat-body">La soumission est bloquée si le commentaire est vide. Le responsable reçoit toujours une description précise.</div></div>
      </div>
      <div class="feat">
        <div class="feat-icon" style="background:#fef2f2;">🔒</div>
        <div><div class="feat-title">Fermeture annulable</div><div class="feat-body">Le secouriste peut annuler et revenir aux boutons de décision s'il s'est trompé.</div></div>
      </div>
      <div class="feat">
        <div class="feat-icon" style="background:#f0fdf4;">📧</div>
        <div><div class="feat-title">Transmission aux responsables</div><div class="feat-body">Chaque commentaire d'anomalie est inclus dans le mail de rapport envoyé à la soumission.</div></div>
      </div>
    </div>
  </div>
</div>

---

<!-- SLIDE 6 — RÉCAPITULATIF -->

<div class="slide-col full-slide" style="background:white;">
  <div class="slide-header">
    <div class="slide-eyebrow">Frontoffice · Étape 3</div>
    <div class="slide-title">Récapitulatif & soumission</div>
    <div class="slide-desc">Avant de soumettre, le secouriste visualise tous les résultats. Il saisit son nom et confirme. Un mail est envoyé instantanément aux responsables.</div>
  </div>
  <div class="content" style="align-items:center;gap:60px;">
    <div class="phone">
      <div class="phone-screen" style="display:flex;flex-direction:column;">
        <div class="ms-summary-header">
          <div class="ms-summary-title">Récapitulatif</div>
          <div class="ms-summary-meta">23 matériels vérifiés · <span>2 anomalies</span></div>
        </div>
        <div class="ms-summary-body">
          <div class="ms-compartment">Poche avant</div>
          <div class="ms-result-item ms-result-ok"><span class="ms-result-icon" style="color:#16a34a;">✓</span><span class="ms-result-name">Gants L × 5</span></div>
          <div class="ms-result-item ms-result-ko"><span class="ms-result-icon" style="color:#f59e0b;">⚠</span><div><div class="ms-result-name">SHA 100 ml</div><div class="ms-result-comment">Flacon vide, quantité insuffisante</div></div></div>
          <div class="ms-compartment" style="margin-top:8px;">Compartiment principal</div>
          <div class="ms-result-item ms-result-ok"><span class="ms-result-icon" style="color:#16a34a;">✓</span><span class="ms-result-name">Défibrillateur DAE</span></div>
          <div class="ms-result-item ms-result-ok"><span class="ms-result-icon" style="color:#16a34a;">✓</span><span class="ms-result-name">Oxygène 15L</span></div>
        </div>
        <div class="ms-summary-footer">
          <div class="ms-name-input">Votre nom *</div>
          <div class="ms-submit">Soumettre le contrôle</div>
        </div>
      </div>
    </div>
    <div class="features">
      <div class="feat">
        <div class="feat-icon" style="background:#f0fdf4;">📋</div>
        <div><div class="feat-title">Vue d'ensemble avant validation</div><div class="feat-body">Chaque résultat (présent / anomalie + commentaire + péremption) est listé par emplacement.</div></div>
      </div>
      <div class="feat">
        <div class="feat-icon" style="background:#eff6ff;">👤</div>
        <div><div class="feat-title">Identification du vérificateur</div><div class="feat-body">Le nom est obligatoire à la soumission. Il est inclus dans le mail et historisé.</div></div>
      </div>
      <div class="feat">
        <div class="feat-icon" style="background:#fff7ed;">📬</div>
        <div><div class="feat-title">Mail automatique</div><div class="feat-body">Envoyé à tous les responsables configurés : liste des anomalies, dates de péremption saisies, nom du vérificateur.</div></div>
      </div>
    </div>
  </div>
</div>

---

<!-- SLIDE 7 — GESTION INVENTAIRES -->

<div class="slide-col full-slide" style="background:white;">
  <div class="slide-header">
    <div class="slide-eyebrow">Backoffice · Gestion</div>
    <div class="slide-title">Inventaires, emplacements, matériels</div>
    <div class="slide-desc">Les responsables gèrent la structure complète : création d'inventaires, ajout d'emplacements et de matériels, réorganisation par glisser-déposer.</div>
  </div>
  <div class="content" style="align-items:stretch;">
    <div class="desktop-frame">
      <div class="desktop-bar">
        <div class="desktop-dot" style="background:#ef4444;"></div>
        <div class="desktop-dot" style="background:#f59e0b;"></div>
        <div class="desktop-dot" style="background:#22c55e;"></div>
      </div>
      <div class="desktop-body">
        <div class="sidebar">
          <div class="sidebar-logo">🚑 Secourisme</div>
          <div class="sidebar-item active">📦 Inventaires</div>
          <div class="sidebar-item">✅ Contrôles</div>
          <div class="sidebar-item">⚙️ Paramètres</div>
        </div>
        <div class="main-area">
          <div class="table-header">
            <div class="table-title">Mes inventaires</div>
            <button class="btn-blue">+ Nouvel inventaire</button>
          </div>
          <table class="table">
            <thead><tr><th>Nom</th><th>Emplacements</th><th>Matériels</th><th>Dernier contrôle</th><th>QR Code</th></tr></thead>
            <tbody>
              <tr><td><strong>VSL 42</strong></td><td>4</td><td>23</td><td>Il y a 2 jours</td><td><span style="font-size:11px;color:#2563eb;cursor:default;">📷 Afficher</span></td></tr>
              <tr style="background:#f8fafc;"><td><strong>Sac PS Rouge</strong></td><td>3</td><td>18</td><td>Il y a 5 jours</td><td><span style="font-size:11px;color:#2563eb;cursor:default;">📷 Afficher</span></td></tr>
              <tr><td><strong>Armoire pharmacie</strong></td><td>6</td><td>42</td><td>Jamais</td><td><span style="font-size:11px;color:#2563eb;cursor:default;">📷 Afficher</span></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <div class="features" style="min-width:220px;max-width:240px;">
      <div class="feat">
        <div class="feat-icon" style="background:#eff6ff;">🗂</div>
        <div><div class="feat-title">Hiérarchie à 3 niveaux</div><div class="feat-body">Inventaire → Emplacements → Matériels. Chaque niveau est configurable.</div></div>
      </div>
      <div class="feat">
        <div class="feat-icon" style="background:#fdf4ff;">↕</div>
        <div><div class="feat-title">Réordonnancement</div><div class="feat-body">Glisser-déposer pour trier les emplacements et matériels.</div></div>
      </div>
      <div class="feat">
        <div class="feat-icon" style="background:#f0fdf4;">📷</div>
        <div><div class="feat-title">QR Code intégré</div><div class="feat-body">Généré côté client, affichable et imprimable depuis la page de détail.</div></div>
      </div>
    </div>
  </div>
</div>

---

<!-- SLIDE 8 — TABLEAU DE BORD CONTRÔLES -->

<div class="slide-col full-slide" style="background:white;">
  <div class="slide-header">
    <div class="slide-eyebrow">Backoffice · Contrôles</div>
    <div class="slide-title">Tableau de bord des contrôles</div>
    <div class="slide-desc">Tous les contrôles reçus sont listés avec leurs indicateurs clés. Chaque ligne est cliquable pour voir le détail matériel par matériel.</div>
  </div>
  <div class="content" style="align-items:stretch;">
    <div class="desktop-frame">
      <div class="desktop-bar">
        <div class="desktop-dot" style="background:#ef4444;"></div>
        <div class="desktop-dot" style="background:#f59e0b;"></div>
        <div class="desktop-dot" style="background:#22c55e;"></div>
      </div>
      <div class="desktop-body">
        <div class="sidebar">
          <div class="sidebar-logo">🚑 Secourisme</div>
          <div class="sidebar-item">📦 Inventaires</div>
          <div class="sidebar-item active">✅ Contrôles</div>
          <div class="sidebar-item">⚙️ Paramètres</div>
        </div>
        <div class="main-area">
          <div class="table-header">
            <div class="table-title">Historique des contrôles</div>
            <div style="font-size:11px;color:#64748b;">3 contrôles</div>
          </div>
          <table class="table">
            <thead><tr><th>Inventaire</th><th>Date</th><th>Vérificateur</th><th>Anomalies</th><th>À risque</th><th>À corriger</th></tr></thead>
            <tbody>
              <tr>
                <td><strong>VSL 42</strong></td>
                <td style="color:#64748b;font-size:10px;">20/05/2026 14h32</td>
                <td>Marie D.</td>
                <td><span class="badge badge-red">● 2</span></td>
                <td><span class="badge badge-amber">● 1</span></td>
                <td><span class="badge badge-blue">● 3</span></td>
              </tr>
              <tr style="background:#f8fafc;">
                <td><strong>Sac PS Rouge</strong></td>
                <td style="color:#64748b;font-size:10px;">18/05/2026 09h15</td>
                <td>Jean P.</td>
                <td><span class="badge badge-red">● 1</span></td>
                <td><span class="badge badge-amber">● 0</span></td>
                <td><span class="badge badge-blue">● 1</span></td>
              </tr>
              <tr>
                <td><strong>VSL 42</strong></td>
                <td style="color:#64748b;font-size:10px;">15/05/2026 11h00</td>
                <td>Sophie L.</td>
                <td><span class="badge badge-green">● 0</span></td>
                <td><span class="badge badge-amber">● 2</span></td>
                <td><span class="badge badge-blue">● 0</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <div class="features" style="min-width:220px;max-width:240px;">
      <div class="feat">
        <div class="feat-icon" style="background:#fef2f2;">🔴</div>
        <div><div class="feat-title">Anomalies</div><div class="feat-body">Matériels signalés ou périmés au moment du contrôle (snapshot).</div></div>
      </div>
      <div class="feat">
        <div class="feat-icon" style="background:#fffbeb;">🟡</div>
        <div><div class="feat-title">À risque</div><div class="feat-body">Matériels dont la péremption tombe dans les 30 jours suivant le contrôle.</div></div>
      </div>
      <div class="feat">
        <div class="feat-icon" style="background:#eff6ff;">🔵</div>
        <div><div class="feat-title">À corriger</div><div class="feat-body">Alertes actives aujourd'hui en attente de correction par un responsable.</div></div>
      </div>
    </div>
  </div>
</div>

---

<!-- SLIDE 9 — QR CODE & NOTIFICATIONS -->

<div class="slide-col full-slide" style="background:white;">
  <div class="slide-header">
    <div class="slide-eyebrow">Backoffice · QR Code & Emails</div>
    <div class="slide-title">QR codes imprimables & notifications mail</div>
    <div class="slide-desc">Chaque inventaire génère un QR code directement dans le navigateur. Un mail de rapport est envoyé aux responsables à chaque contrôle soumis.</div>
  </div>
  <div class="content" style="justify-content:center;gap:60px;align-items:center;">
    <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
      <div class="qr-modal">
        <div class="qr-modal-title">QR Code — VSL 42</div>
        <div class="qr-code-box">
          <svg class="qr-pattern" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
            <rect width="21" height="21" fill="white"/>
            <rect x="0" y="0" width="7" height="7" fill="none" stroke="#000" stroke-width="1"/>
            <rect x="1" y="1" width="5" height="5" fill="none" stroke="#000" stroke-width="1"/>
            <rect x="2" y="2" width="3" height="3" fill="#000"/>
            <rect x="14" y="0" width="7" height="7" fill="none" stroke="#000" stroke-width="1"/>
            <rect x="15" y="1" width="5" height="5" fill="none" stroke="#000" stroke-width="1"/>
            <rect x="16" y="2" width="3" height="3" fill="#000"/>
            <rect x="0" y="14" width="7" height="7" fill="none" stroke="#000" stroke-width="1"/>
            <rect x="1" y="15" width="5" height="5" fill="none" stroke="#000" stroke-width="1"/>
            <rect x="2" y="16" width="3" height="3" fill="#000"/>
            <rect x="8" y="0" width="1" height="1" fill="#000"/>
            <rect x="10" y="0" width="1" height="1" fill="#000"/>
            <rect x="12" y="0" width="1" height="1" fill="#000"/>
            <rect x="9" y="2" width="2" height="1" fill="#000"/>
            <rect x="8" y="4" width="2" height="1" fill="#000"/>
            <rect x="11" y="4" width="2" height="2" fill="#000"/>
            <rect x="8" y="7" width="3" height="2" fill="#000"/>
            <rect x="12" y="7" width="2" height="1" fill="#000"/>
            <rect x="9" y="10" width="2" height="2" fill="#000"/>
            <rect x="8" y="13" width="2" height="1" fill="#000"/>
            <rect x="11" y="12" width="3" height="2" fill="#000"/>
            <rect x="8" y="15" width="2" height="3" fill="#000"/>
            <rect x="11" y="16" width="2" height="2" fill="#000"/>
          </svg>
        </div>
        <div class="qr-url">https://app.secourisme.fr/inventaire/vsl-42</div>
        <div class="qr-actions">
          <div class="qr-btn qr-btn-copy">📋 Copier le lien</div>
          <div class="qr-btn qr-btn-print">🖨 Imprimer</div>
        </div>
      </div>
    </div>
    <div class="email-card" style="flex:1;max-width:480px;">
      <div class="email-header">
        <div class="email-icon">📬</div>
        <div class="email-meta">
          <div class="email-from">De : Secourisme App · À : responsables@asso.fr</div>
          <div class="email-subject">Contrôle VSL 42 — 2 anomalies signalées</div>
        </div>
      </div>
      <div class="email-body">
        <div class="email-section">
          <div class="email-section-title">Informations</div>
          <div class="email-row"><span style="color:#64748b;">Vérificateur</span><span style="font-weight:600;">Marie Dupont</span></div>
          <div class="email-row"><span style="color:#64748b;">Date</span><span>20/05/2026 à 14h32</span></div>
          <div class="email-row"><span style="color:#64748b;">Inventaire</span><span style="font-weight:600;">VSL 42</span></div>
        </div>
        <div class="email-section">
          <div class="email-section-title">⚠ Anomalies (2)</div>
          <div class="email-row" style="flex-direction:column;align-items:flex-start;gap:2px;">
            <span style="font-weight:600;">SHA 100 ml</span>
            <span style="font-size:10px;color:#92400e;">Flacon vide, quantité insuffisante</span>
          </div>
          <div class="email-row" style="flex-direction:column;align-items:flex-start;gap:2px;">
            <span style="font-weight:600;">Gants L</span>
            <span style="font-size:10px;color:#92400e;">Boîte ouverte et endommagée</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

---

<!-- SLIDE 10 — GESTION DES COMPTES -->

<div class="slide-col full-slide" style="background:white;">
  <div class="slide-header">
    <div class="slide-eyebrow">Backoffice · Administration</div>
    <div class="slide-title">Gestion des comptes & paramètres</div>
    <div class="slide-desc">Le superadmin crée et administre les associations depuis un espace dédié. Chaque association configure ses propres paramètres et emails de notification.</div>
  </div>
  <div class="content" style="align-items:stretch;gap:24px;">
    <div class="desktop-frame" style="flex:1.2;">
      <div class="desktop-bar">
        <div class="desktop-dot" style="background:#ef4444;"></div>
        <div class="desktop-dot" style="background:#f59e0b;"></div>
        <div class="desktop-dot" style="background:#22c55e;"></div>
      </div>
      <div class="desktop-body">
        <div class="sidebar">
          <div class="sidebar-logo">🔧 Superadmin</div>
          <div class="sidebar-item active">🏢 Associations</div>
        </div>
        <div class="main-area">
          <div class="table-header">
            <div class="table-title">Associations</div>
            <button class="btn-blue">+ Nouvelle association</button>
          </div>
          <table class="table">
            <thead><tr><th>Nom</th><th>Responsable</th><th>Action</th></tr></thead>
            <tbody>
              <tr><td><strong>Croix-Rouge Bordeaux</strong></td><td style="color:#64748b;">resp@cr-bordeaux.fr</td><td><span style="font-size:11px;color:#2563eb;">Administrer →</span></td></tr>
              <tr style="background:#f8fafc;"><td><strong>SAMU Social 33</strong></td><td style="color:#64748b;">admin@samusocial33.fr</td><td><span style="font-size:11px;color:#2563eb;">Administrer →</span></td></tr>
              <tr><td><strong>Protection Civile 64</strong></td><td style="color:#64748b;">contact@pc64.fr</td><td><span style="font-size:11px;color:#2563eb;">Administrer →</span></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <div style="display:flex;flex-direction:column;gap:16px;min-width:280px;">
      <div style="background:#f8fafc;border-radius:12px;padding:16px;border:1px solid #e2e8f0;">
        <div style="font-size:12px;font-weight:700;color:#0f172a;margin-bottom:12px;">⚙️ Paramètres association</div>
        <div style="font-size:11px;color:#64748b;margin-bottom:6px;">Nom de l'association</div>
        <div style="height:28px;border:1.5px solid #e2e8f0;border-radius:8px;background:white;padding:0 8px;display:flex;align-items:center;font-size:11px;color:#334155;margin-bottom:10px;">Croix-Rouge Bordeaux</div>
        <div style="font-size:11px;color:#64748b;margin-bottom:6px;">Emails de notification</div>
        <div style="display:flex;flex-direction:column;gap:4px;margin-bottom:8px;">
          <div style="display:flex;justify-content:space-between;align-items:center;background:white;border:1px solid #e2e8f0;border-radius:8px;padding:5px 8px;">
            <span style="font-size:11px;color:#334155;">resp@cr-bordeaux.fr</span>
            <span style="font-size:10px;color:#ef4444;cursor:default;">✕</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;background:white;border:1px solid #e2e8f0;border-radius:8px;padding:5px 8px;">
            <span style="font-size:11px;color:#334155;">adjoint@cr-bordeaux.fr</span>
            <span style="font-size:10px;color:#ef4444;cursor:default;">✕</span>
          </div>
        </div>
        <div style="height:28px;background:#2563eb;border-radius:8px;display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:600;">Enregistrer</div>
      </div>
      <div style="background:#f0fdf4;border-radius:12px;padding:14px;border:1px solid #bbf7d0;">
        <div style="font-size:11px;font-weight:700;color:#15803d;margin-bottom:6px;">✉️ Invitation par email</div>
        <div style="font-size:11px;color:#374151;line-height:1.5;">À la création d'une association, le responsable reçoit automatiquement un lien pour définir son mot de passe.</div>
      </div>
    </div>
  </div>
</div>
