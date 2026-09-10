(function () {
  "use strict";

  function el(tag, className, html) {
    const e = document.createElement(tag);
    if (className) e.className = className;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML.replace(/\n/g, "<br>");
  }

  function renderStats(data) {
    const row = document.getElementById("stats-row");
    row.innerHTML = "";
    const stats = [
      [data.vehicles.length, "Veículos"],
      [new Set(data.vehicles.map((v) => v.manufacturer)).size, "Marcas"],
      [new Set(data.vehicles.map((v) => v.model)).size, "Modelos"],
    ];
    stats.forEach(([value, label]) => {
      const chip = el("div", "stat-chip", `<b>${value}</b>${label}`);
      row.appendChild(chip);
    });
  }

  function renderCard(vehicle) {
    const card = el("div", "card");
    card.addEventListener("click", () => openModal(vehicle));

    const photoWrap = el("div", "card-photo");
    if (vehicle.cover_photo) {
      const img = el("img");
      img.src = vehicle.cover_photo;
      img.alt = vehicle.model;
      img.style.objectPosition = `${vehicle.cover_focal_x ?? 50}% ${vehicle.cover_focal_y ?? 50}%`;
      photoWrap.appendChild(img);
    } else {
      photoWrap.appendChild(el("span", "placeholder", "Sem foto"));
    }
    if (vehicle.manufacturer_logo) {
      const badge = el("div", "card-badge");
      const badgeImg = el("img");
      badgeImg.src = vehicle.manufacturer_logo;
      badge.appendChild(badgeImg);
      photoWrap.appendChild(badge);
    }
    card.appendChild(photoWrap);

    const body = el("div", "card-body");
    body.appendChild(el("div", "card-manufacturer", vehicle.manufacturer));
    body.appendChild(el("div", "card-model", vehicle.model));
    const subParts = [];
    if (vehicle.model_year) subParts.push(vehicle.model_year);
    if (vehicle.colors && vehicle.colors.length) subParts.push(vehicle.colors.join(", "));
    body.appendChild(el("div", "card-sub", subParts.join(" · ")));
    card.appendChild(body);

    return card;
  }

  function renderGallery(data) {
    const gallery = document.getElementById("gallery");
    const empty = document.getElementById("empty");
    gallery.innerHTML = "";
    if (!data.vehicles.length) {
      empty.hidden = false;
      return;
    }
    data.vehicles.forEach((v) => gallery.appendChild(renderCard(v)));
  }

  function openModal(vehicle) {
    const modal = document.getElementById("modal");
    document.getElementById("modal-manufacturer").textContent = vehicle.manufacturer;
    document.getElementById("modal-title").textContent = vehicle.model;

    const mainPhoto = document.getElementById("modal-photo");
    const photos = vehicle.photos && vehicle.photos.length
      ? vehicle.photos
      : (vehicle.cover_photo ? [{ url: vehicle.cover_photo, focal_x: vehicle.cover_focal_x, focal_y: vehicle.cover_focal_y }] : []);
    if (photos.length) {
      mainPhoto.src = photos[0].url;
      mainPhoto.style.objectPosition = `${photos[0].focal_x ?? 50}% ${photos[0].focal_y ?? 50}%`;
      mainPhoto.style.display = "block";
    } else {
      mainPhoto.style.display = "none";
    }

    const thumbs = document.getElementById("modal-thumbs");
    thumbs.innerHTML = "";
    if (photos.length > 1) {
      photos.forEach((photo) => {
        const t = el("img");
        t.src = photo.url;
        t.style.objectPosition = `${photo.focal_x ?? 50}% ${photo.focal_y ?? 50}%`;
        t.addEventListener("click", () => {
          mainPhoto.src = photo.url;
          mainPhoto.style.objectPosition = t.style.objectPosition;
        });
        thumbs.appendChild(t);
      });
    }

    const tags = document.getElementById("modal-tags");
    tags.innerHTML = "";
    const highlightLabels = {
      one_off: "One-off",
      numbered_edition: "Edição numerada",
      prototype: "Protótipo",
      press_vehicle: "Veículo de imprensa",
      competition_vehicle: "Veículo de competição",
    };
    (vehicle.highlights || []).forEach((h) => {
      tags.appendChild(el("span", "tag neon", highlightLabels[h] || h));
    });

    const specs = document.getElementById("modal-specs");
    specs.innerHTML = "";
    const rows = [
      ["Ano modelo", vehicle.model_year],
      ["Cores", (vehicle.colors || []).join(", ")],
      ["Status", vehicle.status],
      ["Volante", vehicle.steering],
      ["Transmissão", vehicle.transmission],
      ["Tração", vehicle.drivetrain],
      ["Programa", vehicle.program],
      ["Tipo de produção", vehicle.production_type],
      ["Nº / Total produção", [vehicle.production_number, vehicle.production_total].filter(Boolean).join(" / ")],
      ["Market spec", vehicle.market_spec],
      ["Importação", vehicle.import_type],
      ["Origem / Atual", [vehicle.origin_country, vehicle.current_country].filter(Boolean).join(" → ")],
    ];
    rows.forEach(([label, value]) => {
      if (!value) return;
      const row = el("div", "spec-row", `<span class="k">${label}</span><span class="v">${value}</span>`);
      specs.appendChild(row);
    });

    const notesWrap = document.getElementById("modal-notes");
    notesWrap.innerHTML = "";
    const noteBlocks = [
      ["Modificações", vehicle.modifications],
      ["Histórico de acidentes", vehicle.accident_history],
      ["Observações", vehicle.notes],
    ];
    noteBlocks.forEach(([label, value]) => {
      if (!value) return;
      notesWrap.appendChild(el("h4", "note-title", label));
      notesWrap.appendChild(el("p", "note-text", escapeHtml(value)));
    });

    modal.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    document.getElementById("modal").hidden = true;
    document.body.style.overflow = "";
  }

  document.getElementById("modal-close").addEventListener("click", closeModal);
  document.getElementById("modal-backdrop").addEventListener("click", closeModal);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

  fetch("data.json")
    .then((r) => r.json())
    .then((data) => {
      document.title = data.site_title || "Coleção";
      document.getElementById("page-title").textContent = data.site_title || "Coleção";
      document.getElementById("site-title").textContent = data.site_title || "Coleção";
      document.getElementById("site-subtitle").textContent = data.site_subtitle || "";
      renderStats(data);
      renderGallery(data);
    })
    .catch((err) => {
      document.getElementById("empty").hidden = false;
      document.getElementById("empty").textContent = "Não foi possível carregar os dados.";
      console.error(err);
    });
})();
