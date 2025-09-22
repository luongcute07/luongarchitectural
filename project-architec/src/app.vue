<template>
  <div>
    <!-- HEADER -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
      <div class="container">
        <a class="navbar-brand" href="#">📰 NewsDemo</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav me-auto">
            <li class="nav-item"><a class="nav-link active" href="#">Trang chủ</a></li>
            <li class="nav-item"><a class="nav-link" href="#">Giới thiệu</a></li>
          </ul>
          <div class="d-flex">
            <span v-if="loggedIn" class="navbar-text me-3 text-white">
              Xin chào, <b>{{ currentUser }}</b> ({{ userRole }})
            </span>
            <button v-if="!loggedIn" class="btn btn-outline-light" @click="openLogin">Đăng nhập</button>
            <button v-if="loggedIn" class="btn btn-warning" @click="logout">Đăng xuất</button>
          </div>
        </div>
      </div>
    </nav>

    <!-- MAIN -->
    <div class="container py-4">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h1 class="h4">Tin tức mới nhất</h1>
        <button v-if="userRole==='reporter'" class="btn btn-success" @click="openCreate">+ Đăng tin</button>
      </div>

      <!-- Search & filter -->
      <div class="row mb-3 g-2">
        <div class="col-md-4">
          <input v-model="q" @input="onSearch" class="form-control" placeholder="Tìm tin..." />
        </div>
        <div class="col-md-3">
          <select v-model="categoryFilter" @change="refresh" class="form-select">
            <option value="">Tất cả danh mục</option>
            <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>
        <div class="col-md-2">
          <select v-model.number="pageSize" @change="refresh" class="form-select">
            <option :value="5">5 / trang</option>
            <option :value="10">10 / trang</option>
            <option :value="20">20 / trang</option>
          </select>
        </div>
        <div class="col-md-3 text-end">
          <small class="text-muted">Tổng tin: {{ total }}</small>
        </div>
      </div>

      <!-- News list -->
      <div v-if="paginated.length===0" class="alert alert-info">Không có tin nào khớp.</div>
      <div v-for="item in paginated" :key="item.id" class="card mb-3">
        <div class="card-body">
          <div class="d-flex justify-content-between">
            <div>
              <h5 class="card-title mb-1">{{ item.title }}</h5>
              <div class="text-muted small">{{ item.category }} • {{ formatDate(item.published_at) }}</div>
            </div>
            <div>
              <button class="btn btn-sm btn-outline-secondary me-1" @click="viewItem(item)">Xem</button>
              <button v-if="canModify(item)" class="btn btn-sm btn-warning me-1" @click="openEdit(item)">Sửa</button>
              <button v-if="canModify(item)" class="btn btn-sm btn-danger" @click="deleteItem(item)">Xóa</button>
            </div>
          </div>
          <p class="card-text mt-2">{{ item.short_desc }}</p>
        </div>
      </div>

      <!-- Pagination -->
      <nav v-if="pages > 1" aria-label="Page navigation">
        <ul class="pagination">
          <li :class="['page-item', {disabled: page===1}]">
            <a class="page-link" href="#" @click.prevent="goTo(page-1)">«</a>
          </li>
          <li v-for="p in visiblePages" :key="p" :class="['page-item', {active: p===page}]">
            <a class="page-link" href="#" @click.prevent="goTo(p)">{{ p }}</a>
          </li>
          <li :class="['page-item', {disabled: page===pages}]">
            <a class="page-link" href="#" @click.prevent="goTo(page+1)">»</a>
          </li>
        </ul>
      </nav>
    </div>

    <!-- FOOTER -->
    <footer class="bg-dark text-white text-center py-3 mt-4">
      <div class="container">
        <p class="mb-1">&copy; 2025 NewsDemo. All rights reserved.</p>
        <small>Made with Vue.js & Bootstrap</small>
      </div>
    </footer>

    <!-- Modal -->
    <NewsModal
      :open="modalOpen"
      :editing="editing"
      :view-data="viewItemData"
      :categories="categories"
      @close="closeModal"
      @save="saveEdit"
    />

    <!-- Login Modal -->
    <div v-if="loginOpen" class="modal fade show d-block" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Đăng nhập</h5>
            <button type="button" class="btn-close" @click="loginOpen=false"></button>
          </div>
          <div class="modal-body">
            <label class="form-label">Tên đăng nhập</label>
            <input v-model="loginUser" class="form-control" placeholder="Nhập username..." />
            <small class="text-muted">Dùng <b>reporter_1</b> để có quyền Reporter</small>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="loginOpen=false">Hủy</button>
            <button class="btn btn-primary" @click="doLogin">Đăng nhập</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from "vue"
import NewsModal from "./components/NewsModal.vue"

const loggedIn = ref(false)
const userRole = ref("reader")
const currentUser = ref("guest")
const loginOpen = ref(false)
const loginUser = ref("")

const categories = ["Thế giới","Thời sự","Kinh tế","Công nghệ","Giải trí","Thể thao"]
const all = ref([])
const q = ref("")
const categoryFilter = ref("")
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)

const modalOpen = ref(false)
const editing = ref(null)
const viewItemData = ref({})

function genSample(n=200){
  const authors = ["Alice","Bob","Carol","David"]
  const now = Date.now()
  for(let i=1;i<=n;i++){
    const cat = categories[i % categories.length]
    all.value.push({
      id: i,
      title: `Bản tin số ${i} (${cat})`,
      short_desc: `Mô tả ngắn cho tin ${i}`,
      content: `Nội dung chi tiết bài viết ${i}`,
      category: cat,
      author: authors[i % authors.length],
      published_at: new Date(now - i*60000).toISOString(),
      is_deleted: false
    })
  }
}
onMounted(()=>{ genSample(); refresh(); })

function formatDate(d){ return new Date(d).toLocaleString() }
function openLogin(){ loginOpen.value=true }
function doLogin(){
  if(!loginUser.value){ alert("Nhập username"); return }
  currentUser.value = loginUser.value
  loggedIn.value = true
  userRole.value = loginUser.value==="reporter_1" ? "reporter" : "reader"
  loginOpen.value=false
}
function logout(){ loggedIn.value=false; currentUser.value="guest"; userRole.value="reader" }

function filterAndSort(){
  let items = all.value.filter(x=>!x.is_deleted)
  if(categoryFilter.value) items = items.filter(x=>x.category===categoryFilter.value)
  if(q.value) items = items.filter(x=>(x.title+x.short_desc+x.content).toLowerCase().includes(q.value.toLowerCase()))
  items.sort((a,b)=> new Date(b.published_at)-new Date(a.published_at))
  return items
}
const filtered = computed(()=> filterAndSort())
function refresh(){ page.value=1; total.value=filtered.value.length }
function onSearch(){ refresh() }

const pages = computed(()=> Math.max(1, Math.ceil(total.value/pageSize.value)))
const paginated = computed(()=>{
  const s=(page.value-1)*pageSize.value
  return filtered.value.slice(s,s+pageSize.value)
})
const visiblePages = computed(()=>{
  const arr=[]; const start=Math.max(1,page.value-2), end=Math.min(pages.value,page.value+2)
  for(let i=start;i<=end;i++) arr.push(i)
  return arr
})
function goTo(p){ if(p<1)p=1;if(p>pages.value)p=pages.value; page.value=p }

function viewItem(item){ viewItemData.value={...item}; editing.value=null; modalOpen.value=true }
function openCreate(){ editing.value={id:null,title:"",short_desc:"",content:"",category:categories[0],author:currentUser.value,published_at:new Date().toISOString()}; modalOpen.value=true }
function openEdit(item){ editing.value={...item}; modalOpen.value=true }
function closeModal(){ modalOpen.value=false; editing.value=null }
function saveEdit(data){
  if(!data.title){ alert("Thiếu tiêu đề"); return }
  if(data.id){
    const idx=all.value.findIndex(x=>x.id===data.id)
    if(idx>=0) all.value[idx]={...all.value[idx],...data}
  } else {
    const newId=all.value.length?Math.max(...all.value.map(x=>x.id))+1:1
    all.value.push({...data,id:newId})
  }
  closeModal(); refresh()
}
function canModify(item){ return loggedIn.value && userRole.value==="reporter" && item.author===currentUser.value }
function deleteItem(item){ if(confirm("Xóa tin này?")){ const idx=all.value.findIndex(x=>x.id===item.id); if(idx>=0) all.value[idx].is_deleted=true; refresh() } }
</script>
