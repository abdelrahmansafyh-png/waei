export const CHILD_PROGRAM_PAGE_STYLES = `
              .preview-page {
                  min-height: 100%;
                  background: transparent;
                  color: #20294f;
                  padding: 24px;
                  overflow-x: hidden;
                  font-family: Arial, sans-serif;
              }

              .preview-shell {
                max-width: 1180px;
                margin: 0 auto;
              }

              .center-text-only {
                display: flex;
                align-items: center;
                justify-content: center;
              }

              .top-bar {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 18px;
                margin-bottom: 24px;
              }

              .top-btn,
              .preview-badge {
                border: 0;
                text-decoration: none;
                background: #fff;
                color: #20294f;
                padding: 16px 22px;
                border-radius: 24px;
                font-weight: 900;
                box-shadow: 0 12px 32px rgba(62, 87, 120, .13);
              }

              .preview-badge {
                background: linear-gradient(135deg, #8b5cf6, #5b7cfa);
                color: white;
              }

              .child-card {
                display: flex;
                align-items: center;
                gap: 14px;
                background: rgba(255,255,255,.95);
                padding: 12px 18px;
                border-radius: 30px;
                box-shadow: 0 12px 32px rgba(62, 87, 120, .13);
              }

              .avatar-emoji {
                width: 70px;
                height: 70px;
                border-radius: 50%;
                background: #dff4ff;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 42px;
              }

              .child-name {
                font-size: 23px;
                font-weight: 900;
              }

              .xp {
                color: #f5a800;
                font-weight: 900;
                font-size: 18px;
              }

              .xp-bar {
                margin-top: 8px;
                width: 150px;
                height: 10px;
                background: #dce4f5;
                border-radius: 999px;
                overflow: hidden;
              }

              .xp-fill {
                height: 100%;
                width: 65%;
                background: #5ec267;
                border-radius: 999px;
              }

              .hero {
                position: relative;
                background: rgba(255,255,255,.92);
                border: 1px solid rgba(255,255,255,.9);
                border-radius: 42px;
                padding: 26px;
                box-shadow: 0 18px 45px rgba(62, 87, 120, .13);
                overflow: hidden;
              }

              .hero::before {
                content: "";
                position: absolute;
                inset: 0;
                background:
                  radial-gradient(circle at 8% 12%, rgba(255,255,255,.95), transparent 11%),
                  radial-gradient(circle at 92% 8%, rgba(255,218,89,.55), transparent 8%),
                  linear-gradient(135deg, rgba(195,233,255,.9), rgba(255,255,255,.6));
                z-index: 0;
              }

              .hero-inner {
                position: relative;
                z-index: 1;
                display: grid;
                grid-template-columns: 1.1fr .9fr;
                gap: 28px;
                align-items: center;
              }

              .age-pill {
                display: inline-block;
                background: #f0e9ff;
                color: #7048e8;
                padding: 12px 20px;
                border-radius: 999px;
                font-weight: 900;
                margin-bottom: 18px;
                box-shadow: 0 8px 18px rgba(112,72,232,.12);
              }

              .hero-title {
                font-size: 54px;
                line-height: 1.2;
                font-weight: 900;
                margin: 0;
                color: #20294f;
              }

              .hero-desc {
                font-size: 21px;
                line-height: 2;
                color: #667085;
                max-width: 650px;
                margin-top: 18px;
              }

              .stats {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 14px;
                margin-top: 28px;
              }

              .stat {
                background: rgba(255,255,255,.85);
                border: 1px solid #edf0f8;
                border-radius: 24px;
                padding: 18px;
                text-align: center;
                box-shadow: 0 8px 20px rgba(62, 87, 120, .08);
              }

              .stat-icon {
                font-size: 30px;
              }

              .stat-label {
                color: #9aa3b2;
                font-size: 13px;
                font-weight: 800;
                margin-top: 8px;
              }

              .stat-value {
                color: #20294f;
                font-size: 16px;
                font-weight: 900;
                margin-top: 3px;
              }

              .hero-image-wrap {
                background: white;
                padding: 12px;
                border-radius: 34px;
                box-shadow: 0 14px 34px rgba(62, 87, 120, .15);
              }

              .hero-image {
                width: 100%;
                height: 330px;
                border-radius: 26px;
                object-fit: cover;
                display: block;
              }

              .tabs-panel {
                background: rgba(255,255,255,.96);
                margin-top: 26px;
                border-radius: 40px;
                padding: 22px;
                box-shadow: 0 18px 45px rgba(62, 87, 120, .12);
              }

              .tabs-row {
                display: flex;
                gap: 14px;
                overflow-x: auto;
                padding-bottom: 16px;
                margin-bottom: 20px;
              }

              .tab-btn {
                position: relative;
                border: 0;
                min-width: max-content;
                border-radius: 22px;
                padding: 17px 24px;
                background: white;
                color: #20294f;
                font-size: 18px;
                font-weight: 900;
                box-shadow: 0 8px 22px rgba(62, 87, 120, .12);
                cursor: pointer;
              }

              .tab-done-check {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 20px;
                height: 20px;
                margin-inline-start: 6px;
                border-radius: 999px;
                background: #22c55e;
                color: white;
                font-size: 13px;
                font-weight: 900;
              }

              .tab-btn.active {
                background: linear-gradient(135deg, #8b5cf6, #6847f5);
                color: white;
              }

              .tab-btn.active::after {
                content: "";
                position: absolute;
                bottom: -8px;
                left: 50%;
                width: 18px;
                height: 18px;
                background: #6847f5;
                transform: translateX(-50%) rotate(45deg);
                border-radius: 3px;
              }

              .empty {
                background: #f8fbff;
                border: 2px dashed #dbe7ff;
                border-radius: 30px;
                padding: 60px 20px;
                text-align: center;
                font-size: 24px;
                font-weight: 900;
                color: #20294f;
              }

              .content-list {
                display: grid;
                gap: 22px;
              }

              .content-card {
                background: #fbfdff;
                border: 1px solid #e8eefc;
                border-radius: 34px;
                padding: 28px;
                box-shadow: 0 10px 24px rgba(62,87,120,.06);
              }

              .content-title {
                text-align: center;
                color: #7048e8;
                font-size: 30px;
                font-weight: 900;
                margin: 0 0 22px;
              }

              .text-content {
                display: grid;
                grid-template-columns: 1fr 20px;
                gap: 28px;
                align-items: center;
              }

              .text-body {
                font-size: 21px;
                line-height: 2.1;
                color: #667085;
                text-align: center;
                font-weight: 700;
                align-items: center;
                justify-content: center;
              }

              .media-wrap {
                width: 100%;
                margin: 0 auto;
                background: white;
                padding: 12px;
                border-radius: 30px;
                box-shadow: 0 12px 28px rgba(62,87,120,.15);
                overflow: hidden;
              }

              .media-image {
                width: 100%;
                max-height: 380px;
                object-fit: cover;
                border-radius: 22px;
                display: block;
              }

              .video-frame {
                width: 100%;
                aspect-ratio: 16 / 9;
                border: 0;
                border-radius: 22px;
                display: block;
              }

              .learn-showcase {
                display: grid;
                grid-template-columns: minmax(0, 1.25fr) minmax(300px, .75fr);
                gap: 26px;
                align-items: stretch;
              }

              .learn-hero-card {
                position: relative;
                min-height: 310px;
                border-radius: 32px;
                overflow: hidden;
                padding: 34px;
                display: flex;
                align-items: flex-end;
                box-shadow: 0 18px 40px rgba(62,87,120,.16);
                background: linear-gradient(135deg, #dff7ff, #f6e7ff);
              }

              .learn-hero-card.has-image {
                background-size: cover !important;
                background-position: center !important;
              }

              .learn-hero-card::after {
                content: "";
                position: absolute;
                inset: 0;
                background: linear-gradient(90deg, rgba(17,24,39,.55), rgba(17,24,39,.14), rgba(255,255,255,.05));
                pointer-events: none;
              }

              .learn-hero-content {
                position: relative;
                z-index: 1;
                max-width: 460px;
                color: white;
              }

              .learn-badge {
                display: inline-flex;
                align-items: center;
                gap: 7px;
                margin-bottom: 14px;
                border-radius: 999px;
                padding: 9px 14px;
                background: rgba(139,92,246,.95);
                font-size: 13px;
                font-weight: 900;
                box-shadow: 0 10px 22px rgba(76,52,201,.22);
              }

              .learn-hero-title {
                margin: 0;
                font-size: 42px;
                line-height: 1.25;
                font-weight: 1000;
                text-shadow: 0 3px 16px rgba(0,0,0,.24);
              }

              .learn-hero-desc {
                margin: 12px 0 22px;
                font-size: 18px;
                line-height: 1.9;
                font-weight: 800;
                color: rgba(255,255,255,.92);
              }

              .learn-start-btn {
                border: 0;
                cursor: pointer;
                display: inline-flex;
                align-items: center;
                gap: 10px;
                border-radius: 999px;
                padding: 15px 30px;
                background: linear-gradient(135deg, #8b5cf6, #6847f5);
                color: white;
                font-size: 18px;
                font-weight: 1000;
                box-shadow: 0 10px 0 #4c34c9, 0 18px 34px rgba(76,52,201,.28);
              }

              .learn-side-card {
                border-radius: 32px;
                border: 1px solid #e9e4ff;
                background: linear-gradient(180deg, #ffffff, #faf8ff);
                padding: 26px;
                box-shadow: 0 14px 32px rgba(62,87,120,.10);
              }

              .learn-side-label {
                display: inline-flex;
                border-radius: 999px;
                padding: 9px 16px;
                background: #f0e9ff;
                color: #7048e8;
                font-weight: 1000;
                margin-bottom: 14px;
              }

              .learn-side-title {
                color: #20294f;
                font-size: 28px;
                line-height: 1.4;
                font-weight: 1000;
                margin: 0 0 12px;
              }

              .learn-side-desc {
                color: #667085;
                font-size: 16px;
                line-height: 1.9;
                font-weight: 800;
              }

              .learn-next-note {
                margin-top: 22px;
                border-radius: 20px;
                background: #f4f0ff;
                color: #7048e8;
                padding: 14px 16px;
                font-weight: 900;
                line-height: 1.8;
              }

              .activity-guide {
                margin: 0 auto 22px;
                max-width: 820px;
                border-radius: 24px;
                border: 1px solid #ece7ff;
                background: linear-gradient(135deg, #fbfaff, #ffffff);
                padding: 16px 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 14px;
                text-align: right;
                color: #20294f;
                box-shadow: 0 10px 24px rgba(62,87,120,.07);
              }

              .activity-guide > span {
                flex: 0 0 auto;
                width: 44px;
                height: 44px;
                border-radius: 999px;
                background: #eefbf1;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
              }

              .activity-guide strong {
                display: block;
                font-size: 18px;
                font-weight: 1000;
                color: #7048e8;
              }

              .activity-guide p {
                margin: 4px 0 0;
                color: #667085;
                font-size: 14px;
                line-height: 1.7;
                font-weight: 800;
              }

              .activity-grid {
                display: grid;
                grid-template-columns: repeat(3, minmax(0, 1fr));
                gap: 18px;
                margin-top: 24px;
              }

              .activity-card {
                position: relative;
                border: 1px solid #edf0fb;
                border-radius: 26px;
                background: white;
                overflow: hidden;
                box-shadow: 0 12px 26px rgba(62,87,120,.09);
                cursor: pointer;
                text-align: right;
                transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
              }

              .activity-card:hover {
                transform: translateY(-4px);
                box-shadow: 0 18px 34px rgba(62,87,120,.14);
              }

              .activity-card.active {
                border-color: #8b5cf6;
                box-shadow: 0 0 0 4px rgba(139,92,246,.13), 0 18px 34px rgba(62,87,120,.13);
              }

              .activity-card.locked {
                opacity: .72;
                filter: grayscale(.25);
                cursor: not-allowed;
              }

              .activity-cover {
                height: 210px;
                background-size: cover !important;
                background-position: center !important;
                display: flex;
                align-items: flex-start;
                justify-content: space-between;
                padding: 12px;
              }

              .activity-status {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                min-width: 38px;
                height: 34px;
                padding: 0 10px;
                border-radius: 999px;
                background: rgba(255,255,255,.94);
                color: #7048e8;
                font-weight: 1000;
                box-shadow: 0 8px 18px rgba(62,87,120,.14);
              }

              .activity-status.done {
                color: #16a34a;
              }

              .activity-status.lock {
                color: #64748b;
              }

              .activity-body {
                padding: 16px 16px 18px;
              }

              .activity-title {
                min-height: 52px;
                color: #20294f;
                font-size: 17px;
                font-weight: 1000;
                line-height: 1.55;
              }

              .activity-meta {
                margin-top: 12px;
                display: flex;
                justify-content: space-between;
                gap: 10px;
                color: #6e7a99;
                font-size: 13px;
                font-weight: 900;
              }

              .story-player-section {
                margin-top: 26px;
              }

              .story-activity-grid {
                margin-bottom: 6px;
              }

              .challenge-guide > span {
                background: #fff7ed;
                color: #f59e0b;
              }

              .challenge-activity-card.active {
                border-color: #f59e0b;
                box-shadow: 0 0 0 4px rgba(245,158,11,.16), 0 18px 34px rgba(62,87,120,.13);
              }

              .challenge-activity-card .activity-status {
                color: #b45309;
              }

              .challenge-activity-card .activity-status.done {
                color: #16a34a;
              }

              .journey-strip {
                margin-top: 24px;
                border-radius: 28px;
                background: linear-gradient(135deg, #f7f3ff, #ffffff);
                border: 1px solid #ece7ff;
                padding: 20px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 16px;
              }

              .journey-dots {
                display: flex;
                align-items: center;
                gap: 10px;
                flex: 1;
              }

              .journey-dot {
                width: 36px;
                height: 36px;
                border-radius: 999px;
                background: #e5e7eb;
                color: #64748b;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                font-weight: 1000;
                box-shadow: inset 0 -3px 0 rgba(0,0,0,.06);
              }

              .journey-dot.done { background: #22c55e; color: white; }
              .journey-dot.active { background: #7048e8; color: white; transform: scale(1.12); }

              .journey-line {
                height: 3px;
                flex: 1;
                min-width: 18px;
                border-radius: 999px;
                background: repeating-linear-gradient(90deg, #c4b5fd 0 8px, transparent 8px 16px);
              }

              .story-start-card {
                display: grid;
                grid-template-columns: minmax(0, .95fr) minmax(0, 1.05fr);
                gap: 24px;
                align-items: stretch;
                border-radius: 34px;
                padding: 18px;
                background: linear-gradient(135deg, #fff, #f7f3ff);
                border: 1px solid #ece7ff;
                box-shadow: 0 16px 36px rgba(62,87,120,.10);
              }

              .story-start-art {
                position: relative;
                min-height: 360px;
                border-radius: 28px;
                overflow: hidden;
                background-size: cover !important;
                background-position: center !important;
                display: flex;
                align-items: flex-end;
                justify-content: flex-start;
                padding: 22px;
              }

              .story-start-art::after {
                content: "";
                position: absolute;
                inset: 0;
                background:
                  radial-gradient(circle at 20% 18%, rgba(255,255,255,.55), transparent 14%),
                  linear-gradient(180deg, rgba(32,41,79,.05), rgba(32,41,79,.50));
                pointer-events: none;
              }

              .story-floating-character {
                position: absolute;
                right: 24px;
                top: 24px;
                z-index: 1;
                width: 78px;
                height: 78px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 28px;
                background: rgba(255,255,255,.92);
                font-size: 42px;
                box-shadow: 0 14px 28px rgba(62,87,120,.16);
                animation: storyFloat 2.6s ease-in-out infinite;
              }

              @keyframes storyFloat {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-8px); }
              }

              .story-start-badge {
                position: relative;
                z-index: 1;
                display: inline-flex;
                align-items: center;
                border-radius: 999px;
                padding: 12px 18px;
                background: rgba(255,255,255,.94);
                color: #7048e8;
                font-weight: 1000;
                box-shadow: 0 10px 22px rgba(62,87,120,.16);
              }

              .story-start-body {
                display: flex;
                flex-direction: column;
                justify-content: center;
                padding: 20px 8px;
              }

              .story-kicker {
                display: inline-flex;
                align-self: flex-start;
                border-radius: 999px;
                padding: 9px 16px;
                background: #f0e9ff;
                color: #7048e8;
                font-size: 14px;
                font-weight: 1000;
                margin-bottom: 14px;
              }

              .story-start-body h3,
              .native-story-top h3,
              .story-content-panel h3 {
                margin: 0;
                color: #20294f;
                font-size: 36px;
                line-height: 1.35;
                font-weight: 1000;
              }

              .story-start-body p,
              .story-content-panel p {
                color: #667085;
                font-size: 18px;
                line-height: 2;
                font-weight: 800;
                margin: 16px 0 0;
              }

              .story-start-note {
                margin: 22px 0;
                border-radius: 22px;
                padding: 16px 18px;
                background: #fff8db;
                color: #7a5b00;
                font-weight: 900;
                line-height: 1.9;
              }

              .story-main-btn {
                border: 0;
                cursor: pointer;
                align-self: flex-start;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
                border-radius: 999px;
                padding: 16px 30px;
                background: linear-gradient(135deg, #8b5cf6, #6847f5);
                color: white;
                font-size: 18px;
                font-weight: 1000;
                box-shadow: 0 10px 0 #4c34c9, 0 18px 34px rgba(76,52,201,.26);
              }

              .native-story-shell {
                border-radius: 34px;
                padding: 22px;
                background: linear-gradient(180deg, #ffffff, #fbfaff);
                border: 1px solid #ece7ff;
                box-shadow: 0 16px 36px rgba(62,87,120,.10);
              }

              .native-story-top {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 16px;
                margin-bottom: 18px;
              }

              .story-status-pill {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                min-height: 44px;
                border-radius: 999px;
                padding: 0 16px;
                background: #eef7ff;
                color: #3361cc;
                font-weight: 1000;
                flex: 0 0 auto;
              }

              .story-status-pill.done {
                background: #dcfce7;
                color: #15803d;
              }

              .story-progress-line {
                display: flex;
                gap: 8px;
                margin-bottom: 22px;
              }

              .story-progress-line span {
                flex: 1;
                height: 12px;
                border-radius: 999px;
                background: #e5e7eb;
                overflow: hidden;
              }

              .story-progress-line span.done { background: #22c55e; }
              .story-progress-line span.active { background: #8b5cf6; box-shadow: 0 0 0 5px rgba(139,92,246,.12); }

              .story-scene-stage {
                display: grid;
                grid-template-columns: minmax(0, 1.12fr) minmax(300px, .68fr);
                gap: 24px;
                align-items: stretch;
              }

              .story-media-panel {
                position: relative;
                width: 100%;
                aspect-ratio: 16 / 9;
                min-height: 430px;
                border-radius: 38px;
                padding: 0;
                background: #ffffff;
                box-shadow: inset 0 0 0 1px #edf2ff, 0 14px 34px rgba(62,87,120,.12);
                overflow: hidden;
              }

              .story-native-video,
              .story-native-image {
                width: 100%;
                height: 100%;
                min-height: 430px;
                border-radius: 38px;
                object-fit: cover;
                display: block;
                background: #111827;
              }

              .story-native-video.video-ended-clean {
                filter: brightness(1.12) saturate(1.06);
              }

              .story-video-end-actions {
                position: absolute;
                inset: 0;
                z-index: 5;
                display: flex;
                align-items: flex-end;
                justify-content: center;
                gap: 14px;
                padding: 24px;
                background: linear-gradient(180deg, rgba(255,255,255,0), rgba(255,255,255,.18));
                pointer-events: none;
              }

              .story-video-end-actions button {
                pointer-events: auto;
                border: 0;
                cursor: pointer;
                border-radius: 999px;
                padding: 14px 24px;
                font-size: 17px;
                font-weight: 1000;
                box-shadow: 0 12px 26px rgba(17,24,39,.18);
              }

              .story-video-replay-btn {
                background: rgba(255,255,255,.96);
                color: #20294f;
              }

              .story-video-next-btn {
                background: linear-gradient(135deg, #8b5cf6, #6847f5);
                color: white;
              }

              .story-media-placeholder {
                min-height: 430px;
                height: 100%;
                border-radius: 38px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 14px;
                background:
                  radial-gradient(circle at 25% 20%, rgba(255,255,255,.8), transparent 15%),
                  linear-gradient(135deg, #dff7ff, #f6e7ff);
                color: #20294f;
                text-align: center;
                padding: 24px;
              }

              .story-media-placeholder span { font-size: 56px; }
              .story-media-placeholder strong { font-size: 26px; font-weight: 1000; }

              .story-content-panel {
                border-radius: 30px;
                background: #f8fbff;
                border: 1px solid #edf2ff;
                padding: 26px;
                display: flex;
                flex-direction: column;
                justify-content: center;
              }

              .story-scene-text {
                margin-top: 0 !important;
              }

              .story-question-box {
                margin-top: 18px;
                border-radius: 24px;
                padding: 18px;
                background: white;
                border: 1px solid #e9e4ff;
                box-shadow: 0 10px 22px rgba(62,87,120,.07);
              }

              .story-question-box span {
                display: block;
                color: #7048e8;
                font-size: 13px;
                font-weight: 1000;
                margin-bottom: 8px;
              }

              .story-question-box strong {
                display: block;
                color: #20294f;
                font-size: 22px;
                line-height: 1.7;
                font-weight: 1000;
              }

              .story-answer-grid {
                display: grid;
                gap: 12px;
                margin-top: 20px;
              }

              .story-answer-btn {
                border: 2px solid #e9e4ff;
                border-radius: 22px;
                background: white;
                color: #20294f;
                padding: 16px;
                display: flex;
                align-items: center;
                gap: 12px;
                font-size: 17px;
                line-height: 1.6;
                font-weight: 1000;
                text-align: right;
                cursor: pointer;
                box-shadow: 0 10px 22px rgba(62,87,120,.07);
                transition: transform .18s ease, border-color .18s ease, box-shadow .18s ease;
              }

              .story-answer-btn:hover {
                transform: translateY(-3px);
                border-color: #8b5cf6;
                box-shadow: 0 16px 30px rgba(62,87,120,.12);
              }

              .story-answer-btn span {
                flex: 0 0 auto;
                width: 38px;
                height: 38px;
                border-radius: 14px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                background: #f0e9ff;
                color: #7048e8;
              }

              .story-feedback-badge {
                align-self: flex-start;
                border-radius: 999px;
                padding: 10px 16px;
                font-size: 14px;
                font-weight: 1000;
                margin-bottom: 16px;
              }

              .story-feedback-badge.good {
                background: #dcfce7;
                color: #15803d;
              }

              .story-feedback-badge.try {
                background: #fff7ed;
                color: #9a3412;
              }

              .story-done-card {
                margin-top: 20px;
                border-radius: 28px;
                padding: 20px;
                background: #ecfdf5;
                border: 1px solid #bbf7d0;
                color: #166534;
                display: flex;
                gap: 14px;
                align-items: center;
                font-weight: 900;
              }

              .story-done-card > span { font-size: 32px; }
              .story-done-card strong { display: block; font-size: 18px; }
              .story-done-card p { margin: 4px 0 0; color: #15803d; }

              .story-legacy-card {
                border-radius: 34px;
                padding: 22px;
                background: linear-gradient(180deg, #ffffff, #fbfaff);
                border: 1px solid #ece7ff;
                box-shadow: 0 16px 36px rgba(62,87,120,.10);
              }

              .story-legacy-head {
                display: flex;
                gap: 14px;
                align-items: center;
                margin-bottom: 18px;
                color: #20294f;
              }

              .story-legacy-head > span {
                width: 56px;
                height: 56px;
                border-radius: 20px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                background: #f0e9ff;
                font-size: 28px;
              }

              .story-legacy-head strong { display: block; font-size: 22px; font-weight: 1000; }
              .story-legacy-head p { margin: 4px 0 0; color: #667085; font-weight: 800; }

              .story-legacy-frame {
                position: relative;
                width: min(100%, 620px);
                aspect-ratio: 3 / 4;
                margin: 0 auto;
                border-radius: 32px;
                padding: 12px;
                background: white;
                box-shadow: 0 18px 45px rgba(62,87,120,.15);
                overflow: hidden;
              }

              .game-tabs {
                  display: flex;
                  gap: 12px;
                  overflow-x: auto;
                  overflow-y: hidden;
                  padding: 6px 4px 18px;
                  margin-bottom: 16px;
                  max-width: 100%;
                  scrollbar-width: thin;
                }

                .game-tabs::-webkit-scrollbar {
                  height: 8px;
                }

                .game-tabs::-webkit-scrollbar-thumb {
                  background: #d8d2ff;
                  border-radius: 999px;
                }

                .game-tab {
                  flex: 0 0 auto;
                  max-width: 320px;
                  border: 0;
                  cursor: pointer;
                  white-space: normal;
                  overflow: visible;
                  text-overflow: clip;
                  line-height: 1.5;
                  text-align: center;
                  border-radius: 18px;
                  padding: 14px 20px;
                  background: #eef7ff;
                  color: #20294f;
                  font-weight: 900;
                  font-size: 15px;
                  box-shadow: 0 8px 18px rgba(62,87,120,.08);
              }

              .game-tab.active {
                background: linear-gradient(135deg, #8b5cf6, #6847f5);
                color: white;
              }

              .game-done-check {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 20px;
                height: 20px;
                margin-inline-start: 6px;
                border-radius: 999px;
                background: #22c55e;
                color: white;
                font-size: 13px;
                font-weight: 900;
                vertical-align: middle;
              }

              .game-tab.active .game-done-check {
                background: white;
                color: #16a34a;
              }

              .game-player-shell {
                width: 100%;
              }

              .game-player-desktop {
                display: flex;
                justify-content: center;
                width: 100%;
              }

              .game-player-frame {
                position: relative;
                width: min(100%, 620px);
                aspect-ratio: 3 / 4;
                background: white;
                border-radius: 32px;
                padding: 12px;
                box-shadow: 0 18px 45px rgba(62,87,120,.15);
                overflow: hidden;
              }

              .desktop-fullscreen-btn {
                position: absolute;
                top: 18px;
                left: 18px;
                z-index: 10;
                width: 48px;
                height: 48px;
                border: 0;
                border-radius: 16px;
                background: rgba(255,255,255,.96);
                color: #20294f;
                font-size: 22px;
                font-weight: 900;
                cursor: pointer;
                box-shadow: 0 10px 24px rgba(0,0,0,.16);
                display: flex;
                align-items: center;
                justify-content: center;
              }

              .desktop-fullscreen-btn:hover {
                transform: translateY(-1px);
                background: #ffffff;
              }

              .game-player-iframe {
                width: 100%;
                height: 100%;
                border: 0;
                border-radius: 24px;
                display: block;
                background: white;
              }

              .game-player-mobile-btn {
                display: none;
              }

              .game-player-mobile-preview {
                position: relative;
                width: 100%;
                border-radius: 28px;
                overflow: hidden;
                cursor: pointer;
                display: none;
                background: white;
                box-shadow: 0 18px 45px rgba(62,87,120,.15);
              }

              .game-player-mobile-preview-frame {
                width: 100%;
                aspect-ratio: 1 / 1;
                border: 0;
                display: block;
                pointer-events: none;
                background: white;
              }

              .game-player-mobile-overlay {
                position: absolute;
                inset: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                background: linear-gradient(180deg, rgba(15,23,42,.12), rgba(15,23,42,.45));
                color: white;
                font-size: 32px;
                font-weight: 900;
                text-shadow: 0 3px 12px rgba(0,0,0,.35);
              }

              .game-player-mobile-overlay span {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                border-radius: 999px;
                padding: 18px 34px;
                background: linear-gradient(135deg,#8b5cf6,#6847f5);
                box-shadow: 0 10px 0 #4c34c9, 0 18px 36px rgba(76,52,201,.35);
              }

              .game-fullscreen {
                position: fixed;
                inset: 0;
                z-index: 999999;
                width: 100vw;
                height: 100dvh;
                background: #000;
              }

              .game-fullscreen-frame {
                width: 100vw;
                height: 100dvh;
                border: 0;
                display: block;
              }

              .game-fullscreen-close {
                position: fixed;
                top: max(14px, env(safe-area-inset-top));
                left: max(14px, env(safe-area-inset-left));
                z-index: 1000000;
                border: 0;
                border-radius: 999px;
                background: rgba(255,255,255,.96);
                color: #111827;
                padding: 12px 18px;
                font-size: 16px;
                font-weight: 900;
                font-family: inherit;
                box-shadow: 0 14px 34px rgba(0,0,0,.28);
                cursor: pointer;
              }

              .answers-report {
                margin-top: 22px;
                display: grid;
                gap: 18px;
              }

              .answer-card {
                background: white;
                border: 1px solid #e8eefc;
                border-radius: 28px;
                padding: 20px;
                box-shadow: 0 10px 24px rgba(62,87,120,.08);
              }

              .answer-head {
                display: flex;
                justify-content: space-between;
                gap: 12px;
                align-items: center;
                margin-bottom: 14px;
              }

              .answer-pill {
                border-radius: 999px;
                padding: 9px 14px;
                font-size: 13px;
                font-weight: 900;
                background: #eef7ff;
                color: #0E9FAA;
              }

              .answer-pill.ok {
                background: #dcfce7;
                color: #166534;
              }

              .answer-pill.bad {
                background: #fee2e2;
                color: #991b1b;
              }

              .answer-question {
                font-size: 22px;
                line-height: 1.8;
                font-weight: 900;
                color: #0E9FAA;
              }

              .selected-answer-box {
                margin-top: 14px;
                border-radius: 18px;
                padding: 14px;
                background: #fff7ed;
                border: 1px solid #fed7aa;
                color: #9a3412;
                font-weight: 900;
              }

              .file-link {
                display: inline-flex;
                background: #22c55e;
                color: white;
                text-decoration: none;
                padding: 16px 28px;
                border-radius: 999px;
                font-weight: 900;
              }

              .bottom-nav {
                position: sticky;
                bottom: 0;
                margin-top: 24px;
                background: rgba(255,255,255,.92);
                backdrop-filter: blur(10px);
                border-radius: 32px 32px 0 0;
                padding: 16px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                box-shadow: 0 -12px 30px rgba(62,87,120,.1);
              }

              .nav-btn {
                border: 0;
                border-radius: 999px;
                padding: 17px 34px;
                font-size: 19px;
                font-weight: 900;
                cursor: pointer;
              }

              .prev {
                background: white;
                color: #7048e8;
                box-shadow: 0 8px 20px rgba(62,87,120,.12);
              }

              .next {
                background: linear-gradient(135deg, #8b5cf6, #6847f5);
                color: white;
                box-shadow: 0 8px 20px rgba(112,72,232,.22);
              }

              .dots {
                display: flex;
                gap: 8px;
              }

              .dot {
                width: 11px;
                height: 11px;
                border-radius: 999px;
                background: #d7dce8;
              }

              .dot.active {
                width: 38px;
                background: #7048e8;
              }

              .loading-card {
                margin: 120px auto;
                max-width: 520px;
                background: white;
                padding: 40px;
                border-radius: 32px;
                text-align: center;
                font-size: 24px;
                font-weight: 900;
                color: #7048e8;
              }

              .pro-lock-card {
                background: #fff8d9;
                border: 2px solid #f4e7a2;
                border-radius: 30px;
                padding: 28px;
                margin-top: 28px;
                box-shadow: 0 12px 28px rgba(122,107,34,.1);
              }

              .pro-lock-title {
                font-size: 28px;
                font-weight: 900;
                color: #0E9FAA;
              }

              .pro-lock-text {
                margin-top: 12px;
                font-size: 18px;
                font-weight: 800;
                line-height: 1.9;
                color: #7A6B22;
              }

              .pro-lock-link {
                display: inline-flex;
                margin-top: 18px;
                background: #0E9FAA;
                color: white;
                text-decoration: none;
                padding: 16px 28px;
                border-radius: 999px;
                font-weight: 900;
              }

              @media (max-width: 900px) {
                .preview-page {
                  padding: 10px;
                  font-family: Arial, sans-serif;
                }

                .preview-shell {
                  max-width: 100%;
                }

                /* الموبايل: لا نخلي كروت الطفل/التقدم/الوقت تاخذ شاشة كاملة */
                .top-bar {
                  position: sticky;
                  top: 0;
                  z-index: 50;
                  display: grid;
                  grid-template-columns: 1fr 1fr 1fr;
                  gap: 10px;
                  margin: -2px -2px 12px;
                  padding: 8px;
                  border-radius: 0 0 26px 26px;
                  background: rgba(245, 251, 255, .86);
                  backdrop-filter: blur(14px);
                  -webkit-backdrop-filter: blur(14px);
                  box-shadow: 0 10px 26px rgba(20,34,74,.08);
                }

                .child-card {
                  min-width: 0;
                  justify-content: center;
                  gap: 8px;
                  padding: 10px 12px;
                  border-radius: 22px;
                  box-shadow: 0 8px 20px rgba(62,87,120,.09);
                }

                .child-card:nth-child(1) {
                  grid-column: 1 / -1;
                  justify-content: space-between;
                  padding-inline: 14px;
                }

                .child-card:nth-child(2),
                .child-card:nth-child(3),
                .top-btn {
                  min-height: 78px;
                }

                .avatar-emoji {
                  width: 50px;
                  height: 50px;
                  font-size: 32px;
                  flex: 0 0 auto;
                }

                .child-name {
                  font-size: 16px;
                  line-height: 1.25;
                }

                .xp {
                  font-size: 14px;
                  line-height: 1.35;
                }

                .xp-bar {
                  width: 100px;
                  height: 8px;
                  margin-top: 6px;
                }

                .top-btn {
                  grid-column: auto;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  padding: 10px 8px;
                  border-radius: 20px;
                  text-align: center;
                  font-size: 14px;
                  line-height: 1.5;
                }

                .preview-badge {
                  display: none;
                }

                .hero {
                  border-radius: 28px;
                  padding: 14px;
                  box-shadow: 0 12px 30px rgba(62,87,120,.10);
                }

                .hero-inner {
                  grid-template-columns: 1fr;
                  gap: 14px;
                }

                .age-pill {
                  display: inline-flex;
                  margin-bottom: 10px;
                  padding: 8px 14px;
                  font-size: 13px;
                }

                .hero-title {
                  font-size: 30px;
                  text-align: center;
                  line-height: 1.35;
                }

                .hero-desc {
                  text-align: center;
                  font-size: 16px;
                  line-height: 1.9;
                  margin-top: 10px;
                }

                .stats {
                  grid-template-columns: repeat(3, 1fr);
                  gap: 8px;
                  margin-top: 16px;
                }

                .stat {
                  border-radius: 20px;
                  padding: 12px 6px;
                }

                .stat-icon {
                  font-size: 24px;
                }

                .stat-label {
                  font-size: 11px;
                }

                .stat-value {
                  font-size: 12px;
                  line-height: 1.35;
                }

                .hero-image-wrap {
                  padding: 8px;
                  border-radius: 24px;
                }

                .hero-image {
                  height: 190px;
                  border-radius: 18px;
                }

                .tabs-panel {
                  margin-top: 14px;
                  border-radius: 28px;
                  padding: 12px;
                }

                .tabs-row {
                  gap: 10px;
                  padding: 4px 2px 14px;
                  margin-bottom: 12px;
                  scroll-snap-type: x mandatory;
                }

                .tab-btn {
                  padding: 12px 16px;
                  border-radius: 18px;
                  font-size: 15px;
                  scroll-snap-align: start;
                }

                .tab-btn.active::after {
                  bottom: -7px;
                  width: 14px;
                  height: 14px;
                }

                .content-list {
                  gap: 14px;
                }

                .content-card {
                  border-radius: 26px;
                  padding: 16px;
                }

                .content-title {
                  font-size: 24px;
                  margin-bottom: 14px;
                  line-height: 1.45;
                }

                .text-content {
                  grid-template-columns: 1fr;
                  gap: 0;
                }

                .text-body {
                  font-size: 17px;
                  line-height: 2;
                  text-align: center;
                }

                .media-wrap {
                  padding: 8px;
                  border-radius: 24px;
                }

                .media-image {
                  max-height: 230px;
                  border-radius: 18px;
                }

                .video-frame {
                  border-radius: 18px;
                }

                .learn-showcase {
                display: grid;
                grid-template-columns: minmax(0, 1.25fr) minmax(300px, .75fr);
                gap: 26px;
                align-items: stretch;
              }

              .learn-hero-card {
                position: relative;
                min-height: 310px;
                border-radius: 32px;
                overflow: hidden;
                padding: 34px;
                display: flex;
                align-items: flex-end;
                box-shadow: 0 18px 40px rgba(62,87,120,.16);
                background: linear-gradient(135deg, #dff7ff, #f6e7ff);
              }

              .learn-hero-card.has-image {
                background-size: cover !important;
                background-position: center !important;
              }

              .learn-hero-card::after {
                content: "";
                position: absolute;
                inset: 0;
                background: linear-gradient(90deg, rgba(17,24,39,.55), rgba(17,24,39,.14), rgba(255,255,255,.05));
                pointer-events: none;
              }

              .learn-hero-content {
                position: relative;
                z-index: 1;
                max-width: 460px;
                color: white;
              }

              .learn-badge {
                display: inline-flex;
                align-items: center;
                gap: 7px;
                margin-bottom: 14px;
                border-radius: 999px;
                padding: 9px 14px;
                background: rgba(139,92,246,.95);
                font-size: 13px;
                font-weight: 900;
                box-shadow: 0 10px 22px rgba(76,52,201,.22);
              }

              .learn-hero-title {
                margin: 0;
                font-size: 42px;
                line-height: 1.25;
                font-weight: 1000;
                text-shadow: 0 3px 16px rgba(0,0,0,.24);
              }

              .learn-hero-desc {
                margin: 12px 0 22px;
                font-size: 18px;
                line-height: 1.9;
                font-weight: 800;
                color: rgba(255,255,255,.92);
              }

              .learn-start-btn {
                border: 0;
                cursor: pointer;
                display: inline-flex;
                align-items: center;
                gap: 10px;
                border-radius: 999px;
                padding: 15px 30px;
                background: linear-gradient(135deg, #8b5cf6, #6847f5);
                color: white;
                font-size: 18px;
                font-weight: 1000;
                box-shadow: 0 10px 0 #4c34c9, 0 18px 34px rgba(76,52,201,.28);
              }

              .learn-side-card {
                border-radius: 32px;
                border: 1px solid #e9e4ff;
                background: linear-gradient(180deg, #ffffff, #faf8ff);
                padding: 26px;
                box-shadow: 0 14px 32px rgba(62,87,120,.10);
              }

              .learn-side-label {
                display: inline-flex;
                border-radius: 999px;
                padding: 9px 16px;
                background: #f0e9ff;
                color: #7048e8;
                font-weight: 1000;
                margin-bottom: 14px;
              }

              .learn-side-title {
                color: #20294f;
                font-size: 28px;
                line-height: 1.4;
                font-weight: 1000;
                margin: 0 0 12px;
              }

              .learn-side-desc {
                color: #667085;
                font-size: 16px;
                line-height: 1.9;
                font-weight: 800;
              }

              .learn-next-note {
                margin-top: 22px;
                border-radius: 20px;
                background: #f4f0ff;
                color: #7048e8;
                padding: 14px 16px;
                font-weight: 900;
                line-height: 1.8;
              }

              .activity-grid {
                display: grid;
                grid-template-columns: repeat(3, minmax(0, 1fr));
                gap: 18px;
                margin-top: 24px;
              }

              .activity-card {
                position: relative;
                border: 1px solid #edf0fb;
                border-radius: 26px;
                background: white;
                overflow: hidden;
                box-shadow: 0 12px 26px rgba(62,87,120,.09);
                cursor: pointer;
                text-align: right;
                transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
              }

              .activity-card:hover {
                transform: translateY(-4px);
                box-shadow: 0 18px 34px rgba(62,87,120,.14);
              }

              .activity-card.active {
                border-color: #8b5cf6;
                box-shadow: 0 0 0 4px rgba(139,92,246,.13), 0 18px 34px rgba(62,87,120,.13);
              }

              .activity-card.locked {
                opacity: .72;
                filter: grayscale(.25);
                cursor: not-allowed;
              }

              .activity-cover {
                height: 210px;
                background-size: cover !important;
                background-position: center !important;
                display: flex;
                align-items: flex-start;
                justify-content: space-between;
                padding: 12px;
              }

              .activity-status {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                min-width: 38px;
                height: 34px;
                padding: 0 10px;
                border-radius: 999px;
                background: rgba(255,255,255,.94);
                color: #7048e8;
                font-weight: 1000;
                box-shadow: 0 8px 18px rgba(62,87,120,.14);
              }

              .activity-status.done {
                color: #16a34a;
              }

              .activity-status.lock {
                color: #64748b;
              }

              .activity-body {
                padding: 16px 16px 18px;
              }

              .activity-title {
                min-height: 52px;
                color: #20294f;
                font-size: 17px;
                font-weight: 1000;
                line-height: 1.55;
              }

              .activity-meta {
                margin-top: 12px;
                display: flex;
                justify-content: space-between;
                gap: 10px;
                color: #6e7a99;
                font-size: 13px;
                font-weight: 900;
              }

              .journey-strip {
                margin-top: 24px;
                border-radius: 28px;
                background: linear-gradient(135deg, #f7f3ff, #ffffff);
                border: 1px solid #ece7ff;
                padding: 20px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 16px;
              }

              .journey-dots {
                display: flex;
                align-items: center;
                gap: 10px;
                flex: 1;
              }

              .journey-dot {
                width: 36px;
                height: 36px;
                border-radius: 999px;
                background: #e5e7eb;
                color: #64748b;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                font-weight: 1000;
                box-shadow: inset 0 -3px 0 rgba(0,0,0,.06);
              }

              .journey-dot.done { background: #22c55e; color: white; }
              .journey-dot.active { background: #7048e8; color: white; transform: scale(1.12); }

              .journey-line {
                height: 3px;
                flex: 1;
                min-width: 18px;
                border-radius: 999px;
                background: repeating-linear-gradient(90deg, #c4b5fd 0 8px, transparent 8px 16px);
              }

              .story-start-card,
              .story-scene-stage {
                grid-template-columns: 1fr;
              }

              .story-start-card,
              .native-story-shell,
              .story-legacy-card {
                border-radius: 26px;
                padding: 14px;
              }

              .story-start-art {
                min-height: 230px;
                border-radius: 22px;
              }

              .story-floating-character {
                width: 58px;
                height: 58px;
                border-radius: 20px;
                font-size: 32px;
              }

              .story-start-body {
                padding: 10px 2px;
                text-align: center;
                align-items: center;
              }

              .story-kicker,
              .story-main-btn,
              .story-feedback-badge {
                align-self: center;
              }

              .story-start-body h3,
              .native-story-top h3,
              .story-content-panel h3 {
                font-size: 24px;
                text-align: center;
              }

              .story-start-body p,
              .story-content-panel p,
              .story-scene-text {
                font-size: 16px;
                line-height: 1.9;
                text-align: center;
              }

              .native-story-top {
                flex-direction: column;
                text-align: center;
              }

              .story-media-panel {
                min-height: 250px;
                border-radius: 28px;
              }

              .story-native-video,
              .story-native-image,
              .story-media-placeholder {
                min-height: 250px;
                border-radius: 28px;
              }

              .story-video-end-actions {
                align-items: flex-end;
                flex-wrap: wrap;
                padding: 16px;
                gap: 10px;
              }

              .story-video-end-actions button {
                padding: 12px 18px;
                font-size: 14px;
              }

              .story-content-panel {
                border-radius: 24px;
                padding: 18px;
              }

              .story-question-box strong {
                font-size: 18px;
                text-align: center;
              }

              .story-answer-btn {
                font-size: 15px;
                border-radius: 18px;
                padding: 13px;
              }

              .story-legacy-frame {
                width: 100%;
                border-radius: 24px;
              }

              .game-tabs {
                  gap: 9px;
                  padding-bottom: 12px;
                  margin-bottom: 12px;
                }

                .game-tab {
                  max-width: 150px;
                  border-radius: 16px;
                  padding: 12px 16px;
                  font-size: 14px;
                }

                .game-player-desktop {
                  display: none;
                }

                .game-player-mobile-btn {
                  display: none;
                }

                .game-player-mobile-preview {
                  display: block;
                  border-radius: 24px;
                }

                .game-player-mobile-overlay {
                  font-size: 24px;
                }

                .game-player-mobile-overlay span {
                  padding: 14px 24px;
                  box-shadow: 0 8px 0 #4c34c9, 0 14px 28px rgba(76,52,201,.30);
                }

                .bottom-nav {
                  position: sticky;
                  bottom: 8px;
                  z-index: 40;
                  gap: 10px;
                  margin-top: 14px;
                  border-radius: 24px;
                  padding: 10px;
                  box-shadow: 0 -10px 28px rgba(62,87,120,.11);
                }

                .dots {
                  display: none;
                }

                .nav-btn {
                  flex: 1;
                  padding: 13px 12px;
                  font-size: 15px;
                }

                .answers-report {
                  gap: 12px;
                }

                .answer-card {
                  border-radius: 22px;
                  padding: 14px;
                }

                .answer-head {
                  flex-direction: column;
                  align-items: stretch;
                }

                .answer-question {
                  font-size: 18px;
                  text-align: center;
                }

                .selected-answer-box {
                  font-size: 15px;
                  line-height: 1.8;
                }

                .activity-guide {
                  margin: 0 0 12px;
                  padding: 12px;
                  border-radius: 20px;
                  justify-content: flex-start;
                  text-align: right;
                }

                .activity-guide > span {
                  width: 38px;
                  height: 38px;
                  font-size: 21px;
                }

                .activity-guide strong {
                  font-size: 15px;
                }

                .activity-guide p {
                  font-size: 12px;
                  line-height: 1.6;
                }

                .learn-showcase,
                .learn-side-card,
                .learn-hero-card {
                  display: none !important;
                }

                .activity-grid {
                  grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
                  gap: 12px;
                  margin-top: 12px;
                }

                .activity-card {
                  display: grid;
                  grid-template-columns: 150px minmax(0, 1fr);
                  min-height: 150px;
                  border-radius: 22px;
                }

                .activity-card:hover {
                  transform: none;
                }

                .activity-cover {
                  height: 100%;
                  min-height: 165px;
                  padding: 9px;
                }

                .activity-status {
                  min-width: 30px;
                  height: 28px;
                  padding: 0 8px;
                  font-size: 12px;
                }

                .activity-body {
                  padding: 12px 14px;
                  display: flex;
                  flex-direction: column;
                  justify-content: center;
                }

                .activity-title {
                  min-height: 0;
                  font-size: 15px;
                  line-height: 1.55;
                }

                .activity-meta {
                  margin-top: 10px;
                  font-size: 12px;
                }

                .journey-strip {
                  display: none;
                }
              }

              @media (max-width: 1100px) and (min-width: 901px) {
                .activity-grid {
                  grid-template-columns: repeat(2, minmax(0, 1fr));
                }
              }

              @media (max-width: 640px) {
                .activity-grid {
                  grid-template-columns: 1fr !important;
                }

                .activity-card {
                  grid-template-columns: 150px minmax(0, 1fr);
                }
              }



                .nav-btn.next.disabled {
                  opacity: 0.55;
                  cursor: not-allowed;
                  filter: grayscale(0.25);
                  transform: none !important;
                }
              `;
