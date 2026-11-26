    'use strict';
    // Menu mobile: Escape, klik latar, focus trap, dan reset pada desktop.
    const toggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('#menu');
    const scrim = document.querySelector('.scrim');
    const mobile = matchMedia('(max-width: 1023.98px)');
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    let menuOpen = false;
    const lightbox = document.querySelector('#lightbox');
    function syncScrollLock() { document.body.classList.toggle('locked', menuOpen || lightbox.open); }
    function setMenu(open, restoreFocus = true) {
      menuOpen = open;
      nav.classList.toggle('open', open);
      scrim.hidden = !open;
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Tutup menu' : 'Buka menu');
      nav.inert = mobile.matches && !open;
      syncScrollLock();
      if (open) nav.querySelector('a').focus();
      else if (restoreFocus) toggle.focus();
    }
    setMenu(false, false);
    toggle.addEventListener('click', () => setMenu(!menuOpen));
    scrim.addEventListener('click', () => setMenu(false));
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => { if (menuOpen) setMenu(false); }));
    mobile.addEventListener('change', () => setMenu(false, false));
    document.addEventListener('keydown', event => {
      if (!menuOpen) return;
      if (event.key === 'Escape') setMenu(false);
      if (event.key !== 'Tab') return;
      const stops = [...nav.querySelectorAll('a'), toggle];
      const first = stops[0], last = stops[stops.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });

    // Apparition discrète; konten tetap terlihat jika API tidak tersedia.
    if ('IntersectionObserver' in window && !reducedMotion.matches) {
      const observer = new IntersectionObserver(entries => entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
      }), { threshold: 0.08 });
      document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
      document.documentElement.classList.add('motion-ready');
    }

    // Parallax ringan dibatasi pada hero; pembaruan maksimal sekali per frame.
    const heroPhoto = document.querySelector('#hero-photo');
    const heroFrame = document.querySelector('.hero-image');
    const backTop = document.querySelector('#back-top');
    let scheduled = false;
    function updateScroll() {
      backTop.hidden = scrollY < 700;
      if (!reducedMotion.matches) {
        const rect = heroFrame.getBoundingClientRect();
        if (rect.bottom > 0 && rect.top < innerHeight) {
          const shift = Math.max(-18, Math.min(18, (innerHeight / 2 - rect.top - rect.height / 2) * 0.045));
          heroPhoto.style.transform = `translateY(${shift}px)`;
        }
      } else heroPhoto.style.transform = '';
      scheduled = false;
    }
    window.addEventListener('scroll', () => {
      if (!scheduled) { scheduled = true; requestAnimationFrame(updateScroll); }
    }, { passive: true });
    reducedMotion.addEventListener('change', updateScroll);
    updateScroll();
    backTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
      document.querySelector('.logo').focus({ preventScroll: true });
    });

    // Lightbox: dialog native mengelola fokus dan tombol Escape.
    let photoTrigger;
    document.querySelectorAll('.lightbox-trigger').forEach(button => button.addEventListener('click', () => {
      photoTrigger = button;
      const source = button.querySelector('img');
      const image = document.querySelector('#lightbox-image');
      image.src = source.src;
      image.alt = source.alt;
      document.querySelector('#lightbox-caption').textContent = button.dataset.caption;
      lightbox.showModal();
      syncScrollLock();
    }));
    document.querySelector('#close-lightbox').addEventListener('click', () => lightbox.close());
    lightbox.addEventListener('click', event => { if (event.target === lightbox) lightbox.close(); });
    lightbox.addEventListener('close', () => { syncScrollLock(); photoTrigger?.focus(); });

    // Form: validasi native, trim teks, dan pesan WhatsApp tanpa menyimpan data.
    const form = document.querySelector('#consultation-form');
    form.addEventListener('submit', event => {
      event.preventDefault();
      const values = Object.fromEntries(new FormData(form));
      for (const key of Object.keys(values)) values[key] = values[key].trim();
      for (const key of ['nama', 'kota']) {
        if (!values[key]) { form.elements[key].setCustomValidity('Mohon isi bidang ini.'); form.elements[key].reportValidity(); return; }
      }
      if (!form.reportValidity()) return;
      const message = `Halo Bapak Herman, saya ingin konsultasi kolam renang dengan Wijaya Pool.\n\nNama: ${values.nama}\nWhatsApp: ${values.telepon}\nKota lokasi: ${values.kota}\nJenis kolam: ${values.jenis}\nKebutuhan: ${values.pesan || 'Ingin berdiskusi terlebih dahulu.'}\n\nMohon informasi konsultasi dan survei lokasi gratis. Terima kasih.`;
      const url = new URL('https://wa.me/6281380332211');
      url.searchParams.set('text', message);
      document.querySelector('#form-status').textContent = 'Membuka WhatsApp. Periksa pesan sebelum mengirim.';
      window.location.assign(url.href);
    });
    form.addEventListener('input', event => event.target.setCustomValidity(''));
    document.querySelector('#year').textContent = new Date().getFullYear();
