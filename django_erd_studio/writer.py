import os
import libcst as cst
from libcst import matchers as m
from typing import List, Dict, Any, Tuple, Optional

class ModelNotFoundError(Exception):
    """Raised when the requested model class is not found in the file."""
    pass

class DjangoFieldTransformer(cst.CSTTransformer):
    """
    A transformer that updates or adds Django model fields while preserving
    all other class content (methods, decorators, Meta, etc).
    """
    def __init__(self, model_name: str, fields: List[Dict[str, Any]], meta_data: Dict[str, Any] = None):
        self.model_name = model_name
        self.fields_to_sync = {f['name']: f for f in fields}
        self.meta_data = meta_data or {}
        self.processed_fields = set()
        self.model_found = False
        self.in_target_class = False

    def visit_ClassDef(self, node: cst.ClassDef) -> Optional[bool]:
        if node.name.value == self.model_name:
            self.model_found = True
            self.in_target_class = True
            return True
        return False

    def leave_ClassDef(self, original_node: cst.ClassDef, updated_node: cst.ClassDef) -> cst.ClassDef:
        if original_node.name.value == self.model_name:
            self.in_target_class = False
            new_body = list(updated_node.body.body)
            remaining_fields = [name for name in self.fields_to_sync.keys() if name not in self.processed_fields]
            if remaining_fields:
                insert_idx = 0
                for i, stmt in enumerate(new_body):
                    if self._is_field_assignment(stmt):
                        insert_idx = i + 1
                    elif isinstance(stmt, (cst.FunctionDef, cst.ClassDef)):
                        break
                for field_name in remaining_fields:
                    field_data = self.fields_to_sync[field_name]
                    new_field_stmt = self._create_field_statement(field_data)
                    new_body.insert(insert_idx, new_field_stmt)
                    insert_idx += 1
            if self.meta_data:
                meta_idx = -1
                for i, stmt in enumerate(new_body):
                    if isinstance(stmt, cst.ClassDef) and stmt.name.value == 'Meta':
                        meta_idx = i
                        break
                if meta_idx != -1:
                    new_body[meta_idx] = self._update_meta_class(new_body[meta_idx])
                else:
                    insert_pos = len(new_body)
                    for i, stmt in enumerate(new_body):
                        if isinstance(stmt, cst.FunctionDef):
                            insert_pos = i
                            break
                    new_body.insert(insert_pos, self._create_meta_class())
            return updated_node.with_changes(body=updated_node.body.with_changes(body=new_body))
        return updated_node

    def _update_meta_class(self, meta_node: cst.ClassDef) -> cst.ClassDef:
        meta_body = list(meta_node.body.body)
        for key, val in self.meta_data.items():
            found = False
            for i, stmt in enumerate(meta_body):
                if m.matches(
                    stmt,
                    m.SimpleStatementLine(
                        body=[
                            m.Assign(
                                targets=[
                                    m.AssignTarget(
                                        target=m.Name(value=key)
                                    )
                                ]
                            )
                        ]
                    )
                ):
                    meta_body[i] = cst.SimpleStatementLine(
                        body=[
                            cst.Assign(
                                targets=[
                                    cst.AssignTarget(
                                        target=cst.Name(value=key)
                                    )
                                ],
                                value=self._py_to_cst_expr(val)
                            )
                        ]
                    )
                    found = True
                    break
            if not found:
                meta_body.append(
                    cst.SimpleStatementLine(
                        body=[
                            cst.Assign(
                                targets=[
                                    cst.AssignTarget(
                                        target=cst.Name(value=key)
                                    )
                                ],
                                value=self._py_to_cst_expr(val)
                            )
                        ]
                    )
                )
        return meta_node.with_changes(
            body=meta_node.body.with_changes(body=meta_body)
        )

    def _create_meta_class(self) -> cst.ClassDef:
        assignments = []
        for key, val in self.meta_data.items():
            assignments.append(
                cst.SimpleStatementLine(
                    body=[
                        cst.Assign(
                            targets=[
                                cst.AssignTarget(
                                    target=cst.Name(value=key)
                                )
                            ],
                            value=self._py_to_cst_expr(val)
                        )
                    ]
                )
            )
        return cst.ClassDef(
            name=cst.Name(value='Meta'),
            body=cst.IndentedBlock(body=assignments)
        )

    def leave_Assign(self, original_node: cst.Assign, updated_node: cst.Assign) -> Any:
        if not self.in_target_class:
            return updated_node
        if self._is_field_assignment(original_node):
            target_name = original_node.targets[0].target.value
            if target_name in self.fields_to_sync:
                self.processed_fields.add(target_name)
                stmt = self._create_field_statement(self.fields_to_sync[target_name])
                return stmt.body[0]
            else:
                return cst.RemovalSentinel.REMOVE
        return updated_node

    def _is_field_assignment(self, node: cst.CSTNode) -> bool:
        """Checks if a node is a Django field assignment: name = models.Field(...)"""
        if isinstance(node, cst.Assign):
            return m.matches(
                node,
                m.Assign(
                    targets=[
                        m.AssignTarget(
                            target=m.Name()
                        )
                    ],
                    value=m.Call(
                        func=m.Attribute(
                            value=m.Name(value='models'),
                            attr=m.Name()
                        )
                    )
                )
            )
        elif isinstance(node, cst.SimpleStatementLine):
            return any(self._is_field_assignment(stmt) for stmt in node.body)
        return False

    def _create_field_statement(self, field_data: Dict[str, Any]) -> cst.SimpleStatementLine:
        name = field_data['name']
        field_type = field_data['type']
        options = field_data.get('options', {}).copy()
        
        args = []
        if field_type in ('ForeignKey', 'OneToOneField', 'ManyToManyField'):
            to = options.pop('to', "'self'")
            if not (to.startswith("'") or to.startswith('"')):
                to = f"'{to}'"
            args.append(
                cst.Arg(
                    value=cst.parse_expression(to)
                )
            )
            
        for k, v in options.items():
            value_expr = self._py_to_cst_expr(v)
            args.append(
                cst.Arg(
                    keyword=cst.Name(value=k),
                    equal=cst.AssignEqual(),
                    value=value_expr
                )
            )
            
        return cst.SimpleStatementLine(
            body=[
                cst.Assign(
                    targets=[
                        cst.AssignTarget(
                            target=cst.Name(value=name)
                        )
                    ],
                    value=cst.Call(
                        func=cst.Attribute(
                            value=cst.Name(value='models'),
                            attr=cst.Name(value=field_type)
                        ),
                        args=args
                    )
                )
            ]
        )

    def _py_to_cst_expr(self, val: Any) -> cst.BaseExpression:
        if val is True:
            return cst.Name(value='True')
        if val is False:
            return cst.Name(value='False')
        if val is None:
            return cst.Name(value='None')
        if isinstance(val, str):
            if val.startswith('models.'):
                parts = val.split('.')
                node = cst.Name(value=parts[0])
                for part in parts[1:]:
                    node = cst.Attribute(value=node, attr=cst.Name(value=part))
                return node
            else:
                return cst.SimpleString(value=f"'{val}'")
        if isinstance(val, (int, float)):
            return cst.Integer(value=str(val))
        return cst.parse_expression(str(val))

def update_model_in_file(models_file_path: str, model_name: str, fields: List[Dict[str, Any]], meta_data: Dict[str, Any] = None) -> str:
    if not os.path.exists(models_file_path):
        raise FileNotFoundError(f"File not found: {models_file_path}")
        
    with open(models_file_path, 'r', encoding='utf-8') as f:
        source = f.read()
        
    try:
        module = cst.parse_module(source)
    except Exception as e:
        raise SyntaxError(f"Failed to parse {models_file_path}: {e}") from e
        
    transformer = DjangoFieldTransformer(model_name, fields, meta_data)
    modified_module = module.visit(transformer)
    
    if not transformer.model_found:
        raise ModelNotFoundError(f"Model '{model_name}' not found in {models_file_path}")
        
    new_source = modified_module.code
    
    if new_source != source:
        with open(models_file_path, 'w', encoding='utf-8') as f:
            f.write(new_source)
            
    return new_source

def append_new_model(models_file_path: str, model_name: str, fields: List[Dict[str, Any]], meta_data: Dict[str, Any] = None, base_class: str = 'models.Model') -> str:
    if not os.path.exists(models_file_path):
        with open(models_file_path, 'w', encoding='utf-8') as f:
            f.write("from django.db import models\n\n")
            
    with open(models_file_path, 'r', encoding='utf-8') as f:
        source = f.read()
        
    module = cst.parse_module(source)
    for stmt in module.body:
        if isinstance(stmt, cst.ClassDef) and stmt.name.value == model_name:
            return update_model_in_file(models_file_path, model_name, fields, meta_data)
            
    transformer = DjangoFieldTransformer(model_name, fields, meta_data)
    field_lines = [transformer._create_field_statement(f) for f in fields]
    
    body_elements = list(field_lines)
    if meta_data:
        body_elements.append(transformer._create_meta_class())
        
    str_field = 'pk'
    field_names = [f['name'] for f in fields]
    for candidate in ('name', 'title', 'label', 'subject', 'email'):
        if candidate in field_names:
            str_field = candidate
            break
            
    body_elements.append(cst.EmptyLine())
    body_elements.append(
        cst.FunctionDef(
            name=cst.Name(value='__str__'),
            params=cst.Parameters(
                params=[
                    cst.Param(
                        name=cst.Name(value='self')
                    )
                ]
            ),
            body=cst.IndentedBlock(
                body=[
                    cst.SimpleStatementLine(
                        body=[
                            cst.Return(
                                value=cst.parse_expression(f"str(self.{str_field})")
                            )
                        ]
                    )
                ]
            )
        )
    )
    
    new_class = cst.ClassDef(
        name=cst.Name(value=model_name),
        bases=[
            cst.Arg(
                value=cst.parse_expression(base_class)
            )
        ],
        body=cst.IndentedBlock(
            body=body_elements
        )
    )
    
    new_body = list(module.body)
    if new_body:
        new_body.append(cst.EmptyLine())
        new_body.append(cst.EmptyLine())
        
    new_body.append(new_class)
    
    modified_module = module.with_changes(body=new_body)
    new_source = modified_module.code
    
    with open(models_file_path, 'w', encoding='utf-8') as f:
        f.write(new_source)
        
    return new_source

def get_model_diff(models_file_path: str, model_name: str, fields: List[Dict[str, Any]]) -> Tuple[str, str]:
    with open(models_file_path, 'r', encoding='utf-8') as f:
        old_source = f.read()
    try:
        module = cst.parse_module(old_source)
        transformer = DjangoFieldTransformer(model_name, fields)
        modified_module = module.visit(transformer)
        if transformer.model_found:
            return old_source, modified_module.code
        else:
            temp_path = models_file_path + '.tmp'
            try:
                with open(temp_path, 'w', encoding='utf-8') as f:
                    f.write(old_source)
                new_source = append_new_model(temp_path, model_name, fields)
                return old_source, new_source
            finally:
                if os.path.exists(temp_path):
                    os.remove(temp_path)
    except Exception as e:
        return old_source, f"Error generating diff: {e}"

class FieldDeleter(cst.CSTTransformer):
    def __init__(self, model_name: str, field_name: str):
        self.model_name = model_name
        self.field_name = field_name
        self.in_target_class = False
        
    def visit_ClassDef(self, node: cst.ClassDef) -> Optional[bool]:
        if node.name.value == self.model_name:
            self.in_target_class = True
            return True
        return False
        
    def leave_ClassDef(self, original_node: cst.ClassDef, updated_node: cst.ClassDef) -> cst.ClassDef:
        if original_node.name.value == self.model_name:
            self.in_target_class = False
        return updated_node
        
    def leave_SimpleStatementLine(self, original_node: cst.SimpleStatementLine, updated_node: cst.SimpleStatementLine) -> Any:
        if not self.in_target_class:
            return updated_node
            
        for stmt in original_node.body:
            if m.matches(
                stmt,
                m.Assign(
                    targets=[
                        m.AssignTarget(
                            target=m.Name(value=self.field_name)
                        )
                    ]
                )
            ):
                return cst.RemovalSentinel.REMOVE
                
        return updated_node

def delete_field_from_model(models_file_path: str, model_name: str, field_name: str) -> str:
    if not os.path.exists(models_file_path):
        raise FileNotFoundError(f"File not found: {models_file_path}")
        
    with open(models_file_path, 'r', encoding='utf-8') as f:
        source = f.read()
        
    module = cst.parse_module(source)
    transformer = FieldDeleter(model_name, field_name)
    modified_module = module.visit(transformer)
    new_source = modified_module.code
    
    if new_source != source:
        with open(models_file_path, 'w', encoding='utf-8') as f:
            f.write(new_source)
            
    return new_source

def delete_model_from_file(models_file_path: str, model_name: str) -> str:
    if not os.path.exists(models_file_path):
        raise FileNotFoundError(f"File not found: {models_file_path}")
        
    with open(models_file_path, 'r', encoding='utf-8') as f:
        source = f.read()
        
    module = cst.parse_module(source)
    new_body = []
    skip_next_empty = False
    
    for i, stmt in enumerate(module.body):
        if isinstance(stmt, cst.ClassDef) and stmt.name.value == model_name:
            continue
        new_body.append(stmt)
        
    modified_module = module.with_changes(body=new_body)
    new_source = modified_module.code
    
    with open(models_file_path, 'w', encoding='utf-8') as f:
        f.write(new_source)
        
    return new_source
