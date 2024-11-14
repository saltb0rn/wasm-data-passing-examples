typedef struct {
  int a;
  long b;
} example_struct;   /* size = 16 bytes in 64-bit, 8 bytes in 32-bit */


typedef enum { A=1, B, C } example_enum;

typedef union {
  char c;
  long li;
} example_union;

/* 在 JS 中实现, 用来输出字符串到控制台 */
void print(char *);

/*
  from_c_to_js_* 的函数需要在 JS 里面实现: 接受 C 的数据, 在 C 里面调;
  from_js_to_c_* 的函数需要在 C 里面实现: 接受 JS 的数据, 在 JS 里面调用.
 */

/* C to JS */
/* 用来演示处理函数指针 */
static void callback_static(void) {
  print("Message from static callback!");
}

void callback_extern(void) {
  print("Message from extern callback!");
}

void callback_to_set(void) {
  print("Callback set in WebAssembly.Table!");
}

void from_c_to_js_struct(example_struct);
void from_c_to_js_string(char *);
void from_c_to_js_enum(example_enum);
void from_c_to_js_union(example_union, int);
void from_c_to_js_array(int[], int);
void from_c_to_js_pointer(int *);
void from_c_to_js_function_ptr(void (*)(void));
example_struct from_c_to_js_return_struct(int, long); /* 传递符合数据的反例 */
long sum_for_struct(int, long);
char* from_c_to_js_return_string(void);
example_union from_c_to_js_return_union(void);
void (*from_c_to_js_return_function_ptr(void))(void);

/* JS to C */
long from_js_to_c_struct(example_struct);
void from_js_to_c_string(char *);
int from_js_to_c_array(int[], int);
long from_js_to_c_union(example_union, int);
void from_js_to_c_function_ptr(void (*)(void));

void test(void) {

  from_c_to_js_struct((example_struct){
      .a = 10,
      .b = 200
    });

  from_c_to_js_string("Hello, world!");

  from_c_to_js_enum(B);

  example_union un;

  un.c = 'a';
  from_c_to_js_union(un, 0);

  un.li = 100;
  from_c_to_js_union(un, 1);

  un.c = 'B';
  from_c_to_js_union(un, 0);

  example_struct *est;
  est->a = 5;
  est->b = 200;
  from_c_to_js_pointer((void *)est);

  from_c_to_js_array((int[]){ 1, 2, 3, 4 }, 4);

  from_c_to_js_function_ptr(callback_static);
  from_c_to_js_function_ptr(callback_extern);
}

long from_js_to_c_struct(example_struct st) {
  return st.a + st.b;
  /* return (example_struct){ */
  /*   .a = st.a * 2, */
  /*   .b = st.b * 2 */
  /* }; */
}

void from_js_to_c_string(char *str) {
  unsigned int len = 0;
  char *ptr = str;
  while ('\0' != *ptr) {
    ptr++;
    len++;
  }
  print(str);
}

example_enum from_js_to_c_enum(example_enum en) {
  return en;
}

long from_js_to_c_union(example_union un, int fid) {
  if (0 == fid)
    return (long)un.c;
  else
    return un.li;
}

example_struct from_c_to_js_return_struct(int a, long b) {
  return (example_struct){.a = a, .b = b};
}

long sum_for_struct(int a, long b) {
  example_struct st = from_c_to_js_return_struct(a, b);
  return st.a + st.b;
}

char* from_c_to_js_return_string(void) {
  return "Hello, world!";
}

example_union from_c_to_js_return_union(void) {
  return (example_union){
    .li = 12
  };
}

void (*from_c_to_js_return_function_ptr(void))(void) {
  return callback_static;
}

int from_js_to_c_array(int arr[], int len) {
  int sum = 0;
  for (int i = 0; i < len; i++) {
    sum += arr[i];
  }
  return sum;
}

void from_js_to_c_function_ptr(void (*func_ptr)(void)) {
  func_ptr();
}
