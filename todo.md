(A) {cr:2026-11-03} initial build
  #models {cr:2026-11-03} create service tables, tests, and seed
    #users {cr:2026-11-03} {cm:2026-11-10}
    #messages {cr:2026-11-03}
  #modules/users
    add CRUD controllers {cm:2026-11-10}
    create initial users {cm:2026-11-10}
  #modules/messages
    add CRUD controllers
    create initial messages
  #auth {cr:2026-11-03} {cm:2026-11-10}
    add authentication {cm:2026-11-10}

(B) {cr:2026-11-09} #views fixes
  fix styles for `.header__app-header`, header height should not shrink
