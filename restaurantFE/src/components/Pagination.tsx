import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { ChevronRight } from 'lucide-react-native';

interface PaginationProps {
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  totalPages,
  currentPage,
  onPageChange,
}: PaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
      }}
    >
      {pages.map((page) => (
        <TouchableOpacity
          key={page}
          onPress={() => onPageChange(page)}
          style={{
            backgroundColor: page === currentPage ? '#A4D18E' : 'transparent',
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 8,
            marginHorizontal: 4,
            minWidth: 32,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              color: page === currentPage ? '#000205' : '#14212E9E',
              fontWeight: page === currentPage ? '600' : '400',
              fontSize: 14,
            }}
          >
            {page}
          </Text>
        </TouchableOpacity>
      ))}

      {/* Next Button */}
      <TouchableOpacity
        disabled={currentPage === totalPages}
        onPress={() => onPageChange(currentPage + 1)}
        style={{
          marginLeft: 4,
          opacity: currentPage === totalPages ? 0.4 : 1,
        }}
      >
        <ChevronRight size={20} color={'#1B2128'} />
      </TouchableOpacity>
    </View>
  );
}
